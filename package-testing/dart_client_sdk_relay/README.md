# Dart Client SDK Relay App
This application is built to verify the `eppo_sdk` package integrates and operates as expected in a Flutter Web application.

## Running

```shell
flutter run -d chrome --dart-define=EPPO_SDK_KEY=your_sdk_key --dart-define=TEST_RUNNER_HOST=http://localhost --dart-define=TEST_RUNNER_PORT=3000 --dart-define=EPPO_BASE_URL=http://localhost:5000/api
```