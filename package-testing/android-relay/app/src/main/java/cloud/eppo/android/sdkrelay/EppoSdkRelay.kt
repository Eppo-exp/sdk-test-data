package cloud.eppo.android.sdkrelay

import android.app.Application
import android.util.Log
import cloud.eppo.android.EppoClient

class EppoSdkRelay : Application() {

  val API_KEY: String = BuildConfig.API_KEY // Set in root-level local.properties

  override fun onCreate() {
    super.onCreate()
    EppoClient.Builder(API_KEY, this)
        .isGracefulMode(false)
        .assignmentLogger { assignment ->
          Log.d(
              TAG,
              "${assignment.experiment}-> subject: ${assignment.subject} assigned to ${assignment.experiment}")
        }
        .buildAndInitAsync()
        .thenAccept { Log.d(TAG, "Eppo SDK initialized") }
  }

  companion object {
    private const val TAG = "EppoSDKRelay"
  }
}
