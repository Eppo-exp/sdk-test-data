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
import cloud.eppo.android.sdkrelay.ui.theme.EppoApplicationTheme
import io.socket.engineio.client.EngineIOException

class TestClientActivity : ComponentActivity() {
  // UI Controls
  //
  //
  //        // Services
  //        private var mSocket: Socket? = null
  //        var objectMapper: ObjectMapper = ObjectMapper()
  //
  //
  //        private class AssignmentRequest {
  //            var flag: String? = null
  //            var subjectKey: String? = null
  //            var assignmentType: String? = null
  //            var subjectAttributes: Map<String, Any>? = null
  //            var defaultValue: Any? = null
  //        }
  //
  //        private class TestResponse(val result: Any)
  //
  private val socketLog = MutableLiveData<String>()
  private val assignmentLog = MutableLiveData<String>()

  private fun appendSocketLog(entry: String)  {
    socketLog.postValue("$entry\n${socketLog.value}")
  }
  private fun appendAssignmentLog(entry: String) {
    assignmentLog.postValue("$entry\n${assignmentLog.value}")
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      EppoApplicationTheme {
        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
          TestClientScreen(socketLog, assignmentLog, Modifier.padding(innerPadding))
        }
      }
    }

    SocketHandler.setSocket(host = BuildConfig.TEST_RUNNER_HOST, port = BuildConfig.TEST_RUNNER_PORT)
    SocketHandler.establishConnection()

    SocketHandler.mSocket.on("connect_error") { args ->
      val exception: EngineIOException = args[0] as EngineIOException
      appendSocketLog("Connection Error")
      Log.e(TAG,"Connection error", exception)

    }
    SocketHandler.mSocket.on("connect") { args ->
      appendSocketLog("Connected")
      Log.d(TAG,"Connected")
    }
    SocketHandler.mSocket.on("disconnect") { args ->
      appendSocketLog("Disconnected")
      Log.d(TAG,"Disconnected")
    }
    SocketHandler.mSocket.on("/sdk/reset") { args ->
      appendSocketLog("/sdk/reset")
      Log.d(TAG,"/sdk/reset")
    }
    SocketHandler.mSocket.on("/flags/v1/assignment") { args ->
      appendSocketLog("/flags/v1/assignment")
      Log.d(TAG,"/flags/v1/assignment")
    }


    socketLog.postValue("BARRRR")
  }

//        private val onConnectError: Emitter.Listener = Emitter.Listener { args ->
//            val exception: EngineIOException = args.get(0) as EngineIOException
//            if (exception != null && exception.getMessage() != null) {
//                Log.e("Connection error", exception.getMessage())
//            }
//        }

 companion object {
private val TAG = TestClientActivity::class.qualifiedName
 }
}

@Composable
fun TestClientScreen(
    socketLog: LiveData<String>,
    assignmentLog: LiveData<String>,
    modifier: Modifier = Modifier
) {
  val socketLogText: String? by socketLog.observeAsState()
  val assignmentLogText: String? by assignmentLog.observeAsState()

  Column() {
    Column(modifier = modifier.fillMaxHeight(0.5f)) {
      logView("Socket Chat", socketLogText ?: "Socket chat log")
    }
    Column(modifier = modifier.fillMaxHeight(0.5f)) {
      logView("Assignment Log", assignmentLogText ?: "Assignment log")
    }
  }
}



@Composable
fun logView(name: String, log: String) {
  Column {
    Text(name)
    Text(log)
  }
}

//            super.onCreate(savedInstanceState)
//
//            // Socket listeners
//            mSocket?.on("connect_error", onConnectError)
//            mSocket?.on("connect", onConnect)
//            mSocket?.on("disconnect", onRunnerDisconnect)
//            mSocket?.on("/sdk/reset", onSdkReset)
//            mSocket?.on("/flags/v1/assignment", onNewAssignment)
//
//            // Set the view and grab UI handles
//            setContentView(R.layout.activity_socket)
//            mStatus = findViewById(R.id.status_textview)
//            mSocketLog = findViewById(R.id.socket_log_textview)
//            mAssignmentLog = findViewById(R.id.assignment_log_textview)
//            mSocketLogScroll = findViewById(R.id.socket_log_scrollview)
//            mAssignmentLogScroll = findViewById(R.id.assignment_log_scrollview)
//
//            updateStatus("pending")

            // Initialize the SDK
//            reInitializeEppoClient()
//                .thenAccept { client: EppoClient? ->
//                    Log.d(
//                        TAG,
//                        "Eppo SDK initialized"
//                    )
//                    // Now connect to the test runner
//                    mSocket.connect()
//                }
//                .exceptionally { error: Throwable? ->
//                    throw RuntimeException("Unable to initialize.", error)
//                }
//            setContent(
//                LogViewer(getString("@string/label_socket_chat"))
//            )
//        }

//        private fun reInitializeEppoClient(): CompletableFuture<EppoClient> {
//            // Most of the settings used here are intended for debugging only.
//            return EppoClient.Builder(
//                API_KEY,
//                getApplication()
//            )
//                .forceReinitialize(true) // Debug: create a new instance every time
////                .ignoreCache(true) // Debug: don't preload data from the device
//                .host("http://10.0.2.2:5000") // Debug: for local API serving
//                .isGracefulMode(false) // Debug: surface exceptions
//                .assignmentLogger { assignment: Assignment ->
//                    val msg: String =
//                        ((assignment.getExperiment()
//                                + "-> subject: "
//                                + assignment.getSubject()
//                                ).toString() + " assigned to "
//                                + assignment.getExperiment())
//                    Log.d(TAG, msg)
//                    addAssignmentMessage(msg)
//                }
//                .buildAndInitAsync()
//        }
//
//        private fun sendReady() {
//            mSocket?.emit(
//                "READY",
//                arrayOf<String>(READY_PACKET)
//            ) {
//                Log.d(
//                    TAG,
//                    "Ready message ack'd"
//                )
//            }
//        }
//
//        private fun addSocketMessage(payload: String) {
//            mSocketLog!!.append(payload + "\n")
//            mSocketLogScroll!!.post { mSocketLogScroll!!.fullScroll(View.FOCUS_DOWN) }
//        }
//
//        private fun addAssignmentMessage(payload: String) {
//            mAssignmentLog!!.append(payload + "\n")
//            mAssignmentLogScroll!!.post { mAssignmentLogScroll!!.fullScroll(View.FOCUS_DOWN) }
//        }
//
//        private fun updateStatus(status: String) {
//            val fullStr: String = getString(R.string.label_status_prefix, status)
//            mStatus!!.text = fullStr
//        }
//
//        // Event listener lambdas
//        private val onConnect: Emitter.Listener = Emitter.Listener { args ->
//            Log.d(TAG, "(Re)connected")
//            updateStatus("(Re)connected")
//            sendReady()
//        }
//

//
//        private val onSdkReset: Emitter.Listener = Emitter.Listener { args ->
//            val ack: Ack = args.get(args.length - 1) as Ack
//            reInitializeEppoClient()
//                .thenAccept { client: EppoClient? ->
//                    ack.call(true)
//                }
//        }
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
//                Log.d(
//                    TAG,
//                    "Assignment Request received"
//                )
//                updateStatus("Assigning Flag")
//
//                addSocketMessage("flags/v1/assignment:")
//                addSocketMessage(args.get(0).toString())
//
//                // Ack function for responding to the server.
//                val ack: Ack = args.get(args.length - 1) as Ack
//
//                val assignmentRequest:
// cloud.eppo.androidexample.TestClientActivity.AssignmentRequest
//                try {
//                    assignmentRequest =
//                        objectMapper.readValue(
//                            args.get(0).toString(),
//
// cloud.eppo.androidexample.TestClientActivity.AssignmentRequest::class.java
//                        )
//                } catch (e: JsonProcessingException) {
//                    ack.call(genericErrorResponse())
//                    throw RuntimeException(e)
//                }
//
//                val client = EppoClient.getInstance()
//                try {
//                    // Convert the subject attributes map to an `Attributes` instance.
//                    val subject: Attributes =
//                        convertAttributesMapToAttributes(
//                            assignmentRequest
//                        )
//                    val result = getResult(assignmentRequest, client, subject)
//
//                    val testResponse: cloud.eppo.androidexample.TestClientActivity.TestResponse =
//                        cloud.eppo.androidexample.TestClientActivity.TestResponse(result)
//
//                    // "return" the result.
//                    ack.call(objectMapper.writeValueAsString(testResponse))
//                } catch (e: JsonProcessingException) {
//                    ack.call(genericErrorResponse())
//                    throw RuntimeException(e)
//                }
//            }
//        }
//
//        @Throws(JsonProcessingException::class)
//        private fun getResult(
//            assignmentRequest: cloud.eppo.androidexample.TestClientActivity.AssignmentRequest,
//            client: EppoClient,
//            subject: Attributes
//        ): Any {
//            when (assignmentRequest.assignmentType) {
//                "STRING" -> return client.getStringAssignment(
//                    assignmentRequest.flag,
//                    assignmentRequest.subjectKey,
//                    subject,
//                    assignmentRequest.defaultValue as String
//                )
//
//                "INTEGER" -> return client.getIntegerAssignment(
//                    assignmentRequest.flag,
//                    assignmentRequest.subjectKey,
//                    subject,
//                    (assignmentRequest.defaultValue as Int)
//                )
//
//                "BOOLEAN" -> return client.getBooleanAssignment(
//                    assignmentRequest.flag,
//                    assignmentRequest.subjectKey,
//                    subject,
//                    (assignmentRequest.defaultValue as Boolean)
//                )
//
//                "NUMERIC" -> {
//                    val defaultNumericValue =
//                        if ((assignmentRequest.defaultValue is Int))
//                            (
//                                    assignmentRequest.defaultValue as Int
//                                    ).toDouble()
//                        else
//                            (assignmentRequest.defaultValue as Double)
//                    return client.getDoubleAssignment(
//                        assignmentRequest.flag,
//                        assignmentRequest.subjectKey,
//                        subject,
//                        defaultNumericValue
//                    )
//                }
//
//                "JSON" -> {
//                    val defaultValue: JsonNode =
//                        objectMapper.convertValue(
//                            assignmentRequest.defaultValue,
//                            JsonNode::class.java
//                        )
//
//                    return client.getJSONAssignment(
//                        assignmentRequest.flag, assignmentRequest.subjectKey, subject,
// defaultValue
//                    )
//                }
//            }
//            return "NO RESULT"
//        }
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
//            private const val API_KEY = BuildConfig.API_KEY // Set in root-level local.properties
//            private const val READY_PACKET =
//                "{\"sdkName\":\"example\", \"supportsBandits\" : false, \"sdkType\":\"client\"}"
//
//            private fun convertAttributesMapToAttributes(assignmentRequest:
// cloud.eppo.androidexample.TestClientActivity.AssignmentRequest): Attributes {
//                val subject = Attributes()
//                assignmentRequest.subjectAttributes.forEach { (key: String?, value: Any?) ->
//                    if (value is String) {
//                        subject.put(key, value as String)
//                    } else if (value is Int) {
//                        subject.put(key, value as Int)
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
