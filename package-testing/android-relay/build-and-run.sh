#!/bin/bash
# Set default values for vars

: "${SDK_RELAY_HOST:=localhost}"
: "${SDK_RELAY_PORT:=4000}"
: "${SDK_REF:=main}"
SDK="https://github.com/Eppo-exp/android-sdk.git"

# Load the SDK from the repo only if a specific version is not set
if [ -z "${SDK_VERSION}" ]; then
  # checkout the specified ref of the SDK repo, build it, and then insert it into vendors here.
  rm -Rf tmp
  mkdir -p tmp

  echo "Cloning ${SDK}@${SDK_REF}"
  git clone -b ${SDK_REF} --depth 1 --single-branch ${SDK} tmp || ( echo "Cloning repo failed"; exit 1 )

fi

# The `build.gradle.kts` uses local code unless the $SDK_VERSION variable is set.

export EPPO_BASE_URL="http://10.0.2.2:${EPPO_API_PORT:-5000}/api"

# Now, build and install and launch activity
./gradlew assembleDebug installDebug && \
  adb shell am start -n cloud.eppo.android.sdkrelay/.TestClientActivity
