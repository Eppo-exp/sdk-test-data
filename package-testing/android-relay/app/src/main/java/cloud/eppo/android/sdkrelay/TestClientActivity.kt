package cloud.eppo.android.sdkrelay

import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import cloud.eppo.android.EppoClient
import cloud.eppo.api.Attributes
import cloud.eppo.api.EppoValue
import cloud.eppo.logging.Assignment
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import io.socket.client.Ack
import io.socket.engineio.client.EngineIOException
import java.util.concurrent.CompletableFuture
import org.json.JSONObject

class TestClientActivity : ComponentActivity() {
  private val objectMapper: ObjectMapper = ObjectMapper()
  private lateinit var socketHandler: SocketHandler

  data class AssignmentRequest(
      val flag: String,
      val subjectKey: String,
      val assignmentType: String,
      val subjectAttributes: JSONObject,
      val defaultValue: Any
  )

  private val status = MutableLiveData<String>()
  private val assignmentLog = MutableLiveData<String>()

  private fun appendAssignmentLog(entry: String) {
    assignmentLog.postValue("$entry\n${assignmentLog.value}")
  }

  private fun assignmentLogger(assignment: Assignment) {
    val msg: String =
        assignment.experiment +
            "-> subject: " +
            assignment.subject +
            " assigned to " +
            assignment.experiment
    Log.d(TAG, msg)
    appendAssignmentLog(msg)
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Initialize the socket connection
    socketHandler = SocketHandler()
    socketHandler.setSocket(
        host = BuildConfig.TEST_RUNNER_HOST, port = BuildConfig.TEST_RUNNER_PORT)

    // Set listeners
    socketHandler.socket.on("connect_error") { args -> handleConnectError(args) }
    socketHandler.socket.on("connect") { args -> handleConnect(args) }
    socketHandler.socket.on("disconnect") { args -> handleDisconnect(args) }
    socketHandler.socket.on("/sdk/reset") { args -> handleReset(args) }
    socketHandler.socket.on("/flags/v1/assignment") { args -> handleAssignment(args) }

    // Set the UI
    setContent {
      Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
        TestClientScreen(status, assignmentLog, Modifier.padding(innerPadding))
      }
    }

    // Connect to the test runner
    status.postValue(getString(R.string.connecting))
    reInitializeEppoClient().thenRun { socketHandler.establishConnection() }
  }

  private fun handleConnect(args: Array<Any>?) {
    Log.d(TAG, "Connected")
    status.postValue(getString(R.string.connected))
    sendReady()
  }

  private fun handleConnectError(args: Array<Any>) {
    val exception: EngineIOException = args[0] as EngineIOException
    status.postValue(getString(R.string.status_connection_error))
    Log.e(TAG, "Connection error", exception)
  }

  private fun handleAssignment(args: Array<Any>) {
    Log.d(TAG, "Assignment Requested")
    status.postValue(getString(R.string.status_assignment))

    val requestObj = (args[0] as JSONObject)
    val assignmentRequest =
        AssignmentRequest(
            flag = requestObj.getString("flag"),
            subjectKey = requestObj.getString("subjectKey"),
            assignmentType = requestObj.getString("assignmentType"),
            subjectAttributes = requestObj.getJSONObject("subjectAttributes"),
            defaultValue = requestObj.get("defaultValue"))

    // Ack function for responding to the server.
    val ack = args.last() as Ack

    val client = EppoClient.getInstance()

    val eppoValues: MutableMap<String, EppoValue> = mutableMapOf()
    assignmentRequest.subjectAttributes.keys().forEach {
      val value = assignmentRequest.subjectAttributes.get(it.toString())
      val typedValue: EppoValue =
          when (value) {
            is Int -> EppoValue.valueOf(value.toDouble())
            is String -> EppoValue.valueOf(value)
            is Double -> EppoValue.valueOf(value)
            is Boolean -> EppoValue.valueOf(value)
            is List<*> -> EppoValue.valueOf(value.map { insideIt -> insideIt.toString() })
            else -> {
              Log.e(TAG, "Invalid or null subject attribute type.")
              EppoValue.nullValue()
            }
          }
      eppoValues[it.toString()] = typedValue
    }
    val subjectAttributes = Attributes(eppoValues)

    val result = getAssignmentFromClient(assignmentRequest, client, subjectAttributes)
    val jsonResult = JSONObject()
    when (result) {
      is JsonNode -> jsonResult.put("result", JSONObject(result.toString()))
      else -> jsonResult.put("result", result)
    }
    ack.call(jsonResult.toString())
  }

  private fun handleDisconnect(args: Array<Any>) {
    Log.d(TAG, "Disconnected")
    status.postValue(getString(R.string.status_disconnected))

    // Shut down the connection and remove listeners
    socketHandler.closeConnection()

    runOnUiThread { Toast.makeText(this, "Test runner disconnected", Toast.LENGTH_LONG).show() }
  }

  private fun handleReset(args: Array<Any>) {
    Log.d(TAG, "SDK Reset")

    // Initialize the SDK
    val ack = args.last() as Ack
    reInitializeEppoClient().thenAccept { ack.call(true) }
  }

  override fun onDestroy() {
    super.onDestroy()

    socketHandler.closeConnection()
  }

  private fun sendReady() {
    socketHandler.socket.emit("READY", arrayOf<String>(READY_PACKET)) {
      Log.d(TAG, "Ready message acked")
    }
  }

  private fun reInitializeEppoClient(): CompletableFuture<EppoClient> {
    // Most of the settings used here are intended for debugging only.
    return EppoClient.Builder(API_KEY, application)
        .forceReinitialize(true)
        .ignoreCachedConfiguration(true)
        .apiUrl(BuildConfig.EPPO_BASE_URL)
        .isGracefulMode(false) // Debug: surface exceptions
        .assignmentLogger(::assignmentLogger)
        .buildAndInitAsync()
  }

  private fun getAssignmentFromClient(
      assignmentRequest: AssignmentRequest,
      client: EppoClient,
      subject: Attributes
  ): Any {
    return when (assignmentRequest.assignmentType) {
      "STRING" ->
          return client.getStringAssignment(
              assignmentRequest.flag,
              assignmentRequest.subjectKey,
              subject,
              (assignmentRequest.defaultValue as String))

      "INTEGER" ->
          return client.getIntegerAssignment(
              assignmentRequest.flag,
              assignmentRequest.subjectKey,
              subject,
              (assignmentRequest.defaultValue as Int))

      "BOOLEAN" ->
          return client.getBooleanAssignment(
              assignmentRequest.flag,
              assignmentRequest.subjectKey,
              subject,
              (assignmentRequest.defaultValue as Boolean))

      "NUMERIC" -> {
        val defaultNumericValue =
            if (assignmentRequest.defaultValue is Int) assignmentRequest.defaultValue.toDouble()
            else (assignmentRequest.defaultValue as Double)
        return client.getDoubleAssignment(
            assignmentRequest.flag, assignmentRequest.subjectKey, subject, defaultNumericValue)
      }

      "JSON" -> {
        val defaultValue: JsonNode =
            objectMapper.readTree((assignmentRequest.defaultValue as JSONObject).toString())
        val jsonNodeResult =
            client.getJSONAssignment(
                assignmentRequest.flag, assignmentRequest.subjectKey, subject, defaultValue)

        return jsonNodeResult
      }

      else -> "NO RESULT"
    }
  }

  companion object {
    private val TAG = TestClientActivity::class.qualifiedName
    private const val API_KEY = BuildConfig.API_KEY
    private const val READY_PACKET =
        "{\"sdkName\":\"example\", \"supportsBandits\" : false, \"sdkType\":\"client\"}"
  }
}

@Composable
fun TestClientScreen(
    status: LiveData<String>,
    assignmentLog: LiveData<String>,
    modifier: Modifier = Modifier
) {
  val statusString: String? by status.observeAsState()
  val assignmentLogText: String? by assignmentLog.observeAsState()

  Column(modifier = modifier.padding(5.dp)) {
    Status(statusString ?: stringResource(R.string.status_pending))
    LogView(stringResource(R.string.label_assignment_log), assignmentLogText ?: "")
  }
}

@Composable
fun Status(status: String) {
  Row() {
    Text(stringResource(R.string.label_status_prefix), fontWeight = FontWeight.Bold)
    Text(status, fontStyle = FontStyle.Italic)
  }
}

@Composable
fun LogView(name: String, log: String) {
  Column {
    Text(name, fontWeight = FontWeight.Bold, fontSize = 24.sp)
    Text(log)
  }
}
