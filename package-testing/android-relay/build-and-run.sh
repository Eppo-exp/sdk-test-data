#!/bin/bash
# Set default values for vars
: "${SDK_REF:=main}"
SDK="https://github.com/Eppo-exp/android-sdk.git"

: "${EPPO_API_PORT:=5000}"
# The magical IP for an Android emulator to access the machine hosting it is 10.0.2.2
EPPO_BASE_URL=http://10.0.2.2:${EPPO_API_PORT}/api
TEST_RUNNER_HOST=10.0.2.2
: "${TEST_RUNNER_PORT:=3000}"

echo "EPPO_BASE_URL=${EPPO_BASE_URL}"
echo "TEST_RUNNER_HOST=${TEST_RUNNER_HOST}"
echo "TEST_RUNNER_PORT=${TEST_RUNNER_PORT}"

# Load the SDK from the repo only if a specific version is not set
if [ -z "${SDK_VERSION}" ]; then
  # checkout the specified ref of the SDK repo, build it, and then insert it into vendors here.
  rm -Rf tmp
  mkdir -p tmp

  echo "Cloning ${SDK}@${SDK_REF}"
  git clone -b ${SDK_REF} --depth 1 --single-branch ${SDK} tmp || ( echo "Cloning repo failed"; exit 1 )

fi

# The `build.gradle.kts` uses local code unless the $SDK_VERSION variable is set.



# Now, build and install and launch activity
./gradlew assembleDebug installDebug && \
  adb shell am start -n cloud.eppo.android.sdkrelay/.TestClientActivity
