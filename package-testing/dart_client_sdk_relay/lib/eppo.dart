import 'package:eppo_sdk/eppo_sdk.dart';

class MyEppoProvider {

  static final eppoClient = EppoClient(sdkKey: 'IksqoG5KZjTLnWil5Xs0KrCBT.ZWg9NXFocGdkLmUuZXBwby5jbG91ZA', pollInterval: Duration(seconds:5), baseUrl: Uri.parse('http://localhost:5000/api'));
  static final subject = Subject('subject:key');

}
