package cloud.eppo.android.sdkrelay

import android.os.Bundle
import android.util.Log
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
import cloud.eppo.api.EppoValue
import cloud.eppo.logging.Assignment
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import io.socket.client.Ack
import io.socket.engineio.client.EngineIOException
import java.util.concurrent.CompletableFuture
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import org.json.JSONObject

class TestClientActivity : ComponentActivity() {
  val json = Json { ignoreUnknownKeys = true }
  var objectMapper: ObjectMapper = ObjectMapper()

  sealed interface SubjectAttribute {
    data class StringAttribute(val value: String) : SubjectAttribute

    data class IntAttribute(val value: Long) : SubjectAttribute

    data class BooleanAttribute(val value: Boolean) : SubjectAttribute

    data class DoubleAttribute(val value: Double) : SubjectAttribute

    data class ListOfStringsAttribute(val value: List<String>) : SubjectAttribute
  }

  data class AssignmentRequest(
      val flag: String,
      val subjectKey: String,
      val assignmentType: String,
      val subjectAttributes: JSONObject,
      //      @Serializable(with = DefaultValueSerializer::class)
      val defaultValue: Any
  )

  //
  //    object DefaultValueSerializer: KSerializer<Any> {
  //        override val descriptor: SerialDescriptor =
  // PrimitiveSerialDescriptor("subjectAttributes", PrimitiveKind.)
  //        override fun deserialize(decoder: Decoder): Any {
  //            TODO("Not yet implemented")
  //        }
  //
  //        override fun serialize(encoder: Encoder, value: Any) {
  //            when (value) {
  //                is Int -> encoder.encodeInt(value)
  //                is String-> encoder.encodeString(value)
  //            }
  //
  //        }
  //    }

  sealed interface Result {
    data class StringResult(val value: String) : Result

    data class BooleanResult(val value: Boolean) : Result

    data class IntResult(val value: Int) : Result

    data class DoubleResult(val value: Double) : Result

    data class JsonResult(val value: JsonObject) : Result
  }

  //  @Serializable private data class TestResponse(val result: Result)

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
      //      val assignmentRequest =
      // json.decodeFromString<AssignmentRequest>(args.first().toString())
      //
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

      //            val subjectAttributes: Attributes =
      //                Attributes(
      //                    assignmentRequest.subjectAttributes?.mapValues { kvp ->
      //                      when (kvp.value) {
      //                        is SubjectAttribute.StringAttribute ->
      //                            EppoValue.valueOf((kvp.value as
      //       SubjectAttribute.StringAttribute).value)
      //
      //                        is SubjectAttribute.DoubleAttribute ->
      //                            EppoValue.valueOf((kvp.value as
      //       SubjectAttribute.DoubleAttribute).value)
      //
      //                        is SubjectAttribute.IntAttribute ->
      //                            EppoValue.valueOf(
      //                                (kvp.value as
      // SubjectAttribute.IntAttribute).value.toDouble())
      //
      //                        is SubjectAttribute.BooleanAttribute ->
      //                            EppoValue.valueOf((kvp.value as
      //       SubjectAttribute.BooleanAttribute).value)
      //
      //                        is SubjectAttribute.ListOfStringsAttribute ->
      //                            EppoValue.valueOf(
      //                                (kvp.value as
      // SubjectAttribute.ListOfStringsAttribute).value)
      //
      //                        else -> EppoValue.nullValue()
      //                      }
      //                    } ?: emptyMap())
      val result = getResult(assignmentRequest, client, subjectAttributes)
      val jsonResult = JSONObject()
      when (result) {
        is JsonNode -> {
          jsonResult.put("result", JSONObject(result.toString()))
        }

        else -> {
          jsonResult.put("result", result)
        }
      }
      //      jsonResult.put("result", result)
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

  private fun sendReady() {
    SocketHandler.mSocket.emit("READY", arrayOf<String>(READY_PACKET)) {
      Log.d(TAG, "Ready message ack'd")
    }
  }

  private fun reInitializeEppoClient(): CompletableFuture<EppoClient> {
    // Most of the settings used here are intended for debugging only.
    return EppoClient.Builder(API_KEY, getApplication())
        .forceReinitialize(true) // Debug: create a new instance every time
        //                .ignoreCache(true) // Debug: don't preload data from the device
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

      else -> Result.StringResult("NO RESULT")
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

//
//        private val onRunnerDisconnect: Emitter.Listener = Emitter.Listener { args ->
//            // close down the socket and pop a notification.
//            mSocket.close()
//            runOnUiThread {
//                updateStatus("Complete")
//                Toast.makeText(
//                    this@TestClientActivity, "Test runner disconnected", Toast.LENGTH_SHORT
//                )
//                    .show()
//            }
//        }
//
//        private val onNewAssignment: Emitter.Listener = Emitter.Listener { args ->
//            runOnUiThread {
//
//        }
//
//        @Throws(JsonProcessingException::class)
//
//
//        private fun genericErrorResponse(): String {
//            return "{\"error\": \"JSON processing error\"}"
//        }
//
//        override fun onDestroy() {
//            super.onDestroy()
//
//            mSocket.disconnect()
//
//            // Clear all listeners
//            mSocket.off()
//        }

//        companion object {
//            private val TAG: String =TestClientActivity::class.java.getSimpleName()

//
//            private fun convertAttributesMapToAttributes(assignmentRequest:
// cloud.eppo.androidexample.TestClientActivity.AssignmentRequest): Attributes {
//                val subject = Attributes()
//                assignmentRequest.subjectAttributes.forEach { (key: String?, value: Any?) ->
//                    if (value is String) {
//                        subject.put(key, value as String)
//                    } else if (value is Int) {
//                        subject.put(key, value as Long)
//                    } else if (value is Number) {
//                        subject.put(key, value as Double)
//                    } else if (value is Boolean) {
//                        subject.put(key, value as Boolean)
//                    } else {
//                        // Handle other types (potentially throw an exception or log a warning)
//                        Log.e(
//                            TAG,
//                            "Unsupported attribute value type for key: $key"
//                        )
//                    }
//                }
//                return subject
//            }
//        }
