import 'package:eppo_sdk/eppo_sdk.dart';

const globalSdkKey = 'W18Y65TFg5LLAMskn8ETISaeU.ZWg9ZnZjajk1LmUuZXBwby5jbG91ZA';

class MyEppoProvider {
  // print("statically creating instance");
  static final eppoClient =
      EppoClient(sdkKey: globalSdkKey, baseUrl: Uri.parse("https://us-central1-eppo-qa.cloudfunctions.net/serveGitHubRacTestFile/flag-config/v1/config"), pollInterval: Duration(seconds: 5));
  static final subject = Subject('subject:key');
}
