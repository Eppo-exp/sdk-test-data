package cloud.eppo.android.sdkrelay

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import cloud.eppo.android.EppoClient
import cloud.eppo.android.sdkrelay.ui.theme.EppoApplicationTheme
import cloud.eppo.api.Attributes
import cloud.eppo.api.EppoValue

class MainActivity : ComponentActivity() {

  val API_KEY: String = BuildConfig.API_KEY // Set in root-level local.properties

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    // replace the values below with your own experiment and subject keys
    val subjectAttributes = Attributes(mapOf("companyId" to EppoValue.valueOf("1")))

    val eppoClient = EppoClient.getInstance()
    Handler(Looper.getMainLooper())
        .postDelayed(
            {
              val assignedVariation =
                  eppoClient.getStringAssignment(
                      "diagnostics", "test-subject-key", subjectAttributes, "default")
              setContent {
                EppoApplicationTheme {
                  Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Greeting(
                        name = assignedVariation.toString(),
                        modifier = Modifier.padding(innerPadding))
                  }
                }
              }
            },
            1000)
  }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
  Text(text = "Assigned variation: '$name'", modifier = modifier)
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
  EppoApplicationTheme { Greeting("Android") }
}
