#!/usr/bin/env bash

# Set default values for vars
: "${SDK_REF:=main}"
: "${SDK_RELAY_HOST:=localhost}"
: "${SDK_RELAY_PORT:=4000}"
SDK_PACKAGE_NAME="@eppo/node-server-sdk"
SDK_GITHUB="https://github.com/Eppo-exp/node-server-sdk.git"

# if SDK_VERSION is set
if [[ ! -z $SDK_VERSION ]]; then
  echo "Building with SDK at $SDK_VERSION"
  yarn remove $SDK_PACKAGE_NAME
  yarn add "${SDK_PACKAGE_NAME}@${SDK_VERSION}"

else
# otherwise, check out the REPO at the specified ref and then install it locally
  echo "Installing sdk @ ${SDK_REF}"
  SDK_DIR=/tmp/eppo-sdk-dir
  rm -Rf $SDK_DIR
  mkdir -p $SDK_DIR
  git clone -b ${SDK_REF} --depth 1 --single-branch ${SDK_GITHUB} $SDK_DIR
  pushd $SDK_DIR
  yarn install
  popd
  ../local-es-install.sh $SDK_DIR ./
fi


# Build the application
yarn install
yarn build

echo "Listening on port ${SDK_RELAY_PORT}"
yarn start:prod
