import 'package:eppo_sdk/eppo_sdk.dart';

const globalSdkKey = 'W18Y65TFg5LLAMskn8ETISaeU.ZWg9ZnZjajk1LmUuZXBwby5jbG91ZA';

class MyEppoProvider {
  static final eppoClient =
      EppoClient(sdkKey: globalSdkKey, pollInterval: Duration(seconds: 5));
  static final subject = Subject('subject:key');
}
