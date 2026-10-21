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
  # SDK_REF: branch, tag, full commit SHA, refs/..., or <N>/merge (a pull_request ref_name).
  ref="${SDK_REF}"
  if [[ "$ref" =~ ^[0-9]+/(merge|head)$ ]]; then
    ref="refs/pull/${ref}"
  fi
  echo "Installing sdk @ ${ref}"
  SDK_DIR=/tmp/eppo-sdk-dir
  rm -Rf $SDK_DIR
  git init -q $SDK_DIR
  git -C $SDK_DIR fetch -q --depth 1 -- "${SDK_GITHUB}" "${ref}" || { echo "Cloning repo failed"; exit 1; }
  git -C $SDK_DIR checkout -q FETCH_HEAD || exit 1
  echo "Checked out $(git -C $SDK_DIR rev-parse HEAD)"
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
