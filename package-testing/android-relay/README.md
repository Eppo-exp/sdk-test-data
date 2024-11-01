# Eppo SDK Relay App

This app connects to an Eppo Packing Test Runner Server and relays assignment requests to the SDK.

## Running

Build and run the app

```shell
# Uses default version of the SDK (4.2.0)
./gradlew installDebug && \
  adb shell am start -n cloud.eppo.android.sdkrelay/.TestClientActivity 
```

## Build and run the app with a specific version of the SDK
SDK_VERSION=4.2.0 ./build-and-run.sh

## Build and run the app with the SDK at a specific Github REF 
SDK_REF=my/branch/name ./build-and-run.sh
