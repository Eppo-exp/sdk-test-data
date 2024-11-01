package cloud.eppo.android.sdkrelay

import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Modifier
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import cloud.eppo.android.EppoClient
import cloud.eppo.android.sdkrelay.ui.theme.EppoApplicationTheme
import cloud.eppo.api.Attributes
import cloud.eppo.api.Configuration
import cloud.eppo.api.EppoValue
import cloud.eppo.logging.Assignment
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import io.socket.client.Ack
import io.socket.engineio.client.EngineIOException
import java.util.concurrent.CompletableFuture
import org.json.JSONObject
import java.util.function.Supplier

class TestClientActivity : ComponentActivity() {
  var objectMapper: ObjectMapper = ObjectMapper()

  data class AssignmentRequest(
      val flag: String,
      val subjectKey: String,
      val assignmentType: String,
      val subjectAttributes: JSONObject,
      val defaultValue: Any
  )

  private val status = MutableLiveData<String>()
  private val socketLog = MutableLiveData<String>()
  private val assignmentLog = MutableLiveData<String>()

  private fun appendSocketLog(entry: String) {
    socketLog.postValue("$entry\n${socketLog.value}")
  }

  private fun appendAssignmentLog(entry: String) {
    assignmentLog.postValue("$entry\n${assignmentLog.value}")
  }

  private fun assignmentLogger(assignment: Assignment) {
    val msg: String =
        ((assignment.getExperiment() + "-> subject: " + assignment.getSubject()).toString() +
            " assigned to " +
            assignment.getExperiment())
    Log.d(TAG, msg)
    appendAssignmentLog(msg)
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    SocketHandler.setSocket(
        host = BuildConfig.TEST_RUNNER_HOST, port = BuildConfig.TEST_RUNNER_PORT)

    SocketHandler.mSocket.on("connect_error") { args ->
      val exception: EngineIOException = args[0] as EngineIOException
      appendSocketLog("Connection Error")
      Log.e(TAG, "Connection error", exception)
    }
    SocketHandler.mSocket.on("connect") { args ->
      appendSocketLog("connect")
      Log.d(TAG, "Connected")
      status.postValue("Connected")
      sendReady()
    }
    SocketHandler.mSocket.on("disconnect") { args ->
      appendSocketLog("disconnect")
      Log.d(TAG, "Disconnected")
      status.postValue("Disconnected")
      runOnUiThread {
        Toast.makeText(this@TestClientActivity, "Test runner disconnected", Toast.LENGTH_LONG)
            .show()
      }
    }

    SocketHandler.mSocket.on("/sdk/reset") { args ->
      appendSocketLog("/sdk/reset")
      Log.d(TAG, "SDK Reset")

      // Initialize the SDK
      val ack = args.last() as Ack
      reInitializeEppoClient().thenAccept { ack.call(true) }
    }

    SocketHandler.mSocket.on("/flags/v1/assignment") { args ->
      appendSocketLog((args[0] as JSONObject).toString())
      appendSocketLog("/flags/v1/assignment")
      Log.d(TAG, "Assignment Requested")
      status.postValue("Assigning")

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
              is Boolean -> EppoValue.valueOf(value as Boolean)
              is List<*> -> EppoValue.valueOf(value.map { insideIt -> insideIt.toString() })
              else -> {
                Log.e(TAG, "Invalid or null subject attribute type.")
                EppoValue.nullValue()
              }
            }
        eppoValues[it.toString()] = typedValue
      }
      val subjectAttributes = Attributes(eppoValues)

      val result = getResult(assignmentRequest, client, subjectAttributes)
      val jsonResult = JSONObject()
      when (result) {
        is JsonNode -> jsonResult.put("result", JSONObject(result.toString()))
        else -> jsonResult.put("result", result)
      }
      ack.call(jsonResult.toString())
    }

    setContent {
      EppoApplicationTheme {
        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
          TestClientScreen(status, socketLog, assignmentLog, Modifier.padding(innerPadding))
        }
      }
    }

    status.postValue("Connecting")
    reInitializeEppoClient().thenRun { SocketHandler.establishConnection() }
  }

  override fun onDestroy() {
    super.onDestroy()

    SocketHandler.mSocket.disconnect()

    // Clear all listeners
    SocketHandler.mSocket.off()
  }

  private fun sendReady() {
    SocketHandler.mSocket.emit("READY", arrayOf<String>(READY_PACKET)) {
      Log.d(TAG, "Ready message acked")
    }
  }


    private fun reInitializeEppoClient(): CompletableFuture<EppoClient> {
    // Most of the settings used here are intended for debugging only.
    return EppoClient.Builder(API_KEY, getApplication())
        .forceReinitialize(true) // Debug: create a new instance every time
        .ignoreCachedConfiguration(true) // Debug: don't preload data from the device
        .host("http://10.0.2.2:5000") // Debug: for local API serving
        .isGracefulMode(false) // Debug: surface exceptions
        .assignmentLogger(::assignmentLogger)
        .buildAndInitAsync()
  }

  private fun getResult(
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
    private const val API_KEY = BuildConfig.API_KEY // Set in root-level local.properties
    private const val READY_PACKET =
        "{\"sdkName\":\"example\", \"supportsBandits\" : false, \"sdkType\":\"client\"}"
  }
}

@Composable
fun TestClientScreen(
    status: LiveData<String>,
    socketLog: LiveData<String>,
    assignmentLog: LiveData<String>,
    modifier: Modifier = Modifier
) {
  val statusString: String? by status.observeAsState()
  val socketLogText: String? by socketLog.observeAsState()
  val assignmentLogText: String? by assignmentLog.observeAsState()

  Column() {
    Column(modifier = modifier.fillMaxHeight(0.5f)) {
      Status(statusString ?: "Pending")
      LogView("Socket Chat", socketLogText ?: "Socket chat log")
    }
    Column(modifier = modifier.fillMaxHeight(0.5f)) {
      LogView("Assignment Log", assignmentLogText ?: "Assignment log")
    }
  }
}

@Composable
fun Status(status: String) {
  Text("Socket Status: $status")
}

@Composable
fun LogView(name: String, log: String) {
  Column {
    Text(name)
    Text(log)
  }
}
