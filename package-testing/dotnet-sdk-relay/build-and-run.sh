#!/usr/bin/env bash

: "${SDK_VERSION:=3.5.0}"

DOTNET_SDK_VERSION="8.0"

SDK="https://github.com/Eppo-exp/dot-net-server-sdk.git"


if [ -e .env ]; then
  source .env
fi


# Configure environment to **build** the app
echo "Configuring for build"

# Github runners use the package managers below
# https://github.com/actions/runner-images
case "${EPPO_SDK_PLATFORM}" in
    "windows")
        choco install dotnet-sdk -v ${DOTNET_SDK_VERSION}
        ;;
    "macos")
        brew tap isen-ng/dotnet-sdk-versions
        brew install --cask dotnet-sdk8
        ;;
    "linux")
        # Dotnet is already install on gh linux runners
        # sudo apt update
        # sudo apt install dotnet-sdk-${DOTNET_SDK_VERSION}
        ;;
    *)
        echo "Unsupported platform: ${EPPO_SDK_PLATFORM}"
        exit 1
        ;;
esac


echo "dotnet info"
dotnet --info

# Inject desired SDK version
 
dotnet nuget list source
dotnet nuget add source "https://api.nuget.org/v3/index.json" --name "nuget.org"

dotnet remove EppoSDKRelay package Eppo.Sdk

if [[ -n "$SDK_REF" ]]; then
  # Use a local build with a specific github ref

  rm -Rf tmp
  mkdir -p tmp

  echo "Cloning ${SDK}@${SDK_REF}"
  git clone -b ${SDK_REF} --depth 1 --single-branch ${SDK} tmp
  if [ $? -ne 0 ]; then
    echo "Cloning repo failed"
    exit 1
  fi

  pushd tmp
  echo "Building SDK"
  dotnet pack

  echo "Moving build artifact"
  mv dot-net-sdk/bin/Release/*.nupkg ./
  popd

  echo "Adding local dep"
  pushd EppoSDKRelay
  dotnet add package Eppo.Sdk --source ../tmp
  popd
else
  # Use the provided SDK_VERSION (or the default)
  echo "Using Eppo.sdk@${SDK_VERSION}"
  dotnet add EppoSDKRelay package Eppo.Sdk --version $SDK_VERSION 
  if [ $? -ne 0 ]; then
    echo "Adding versioned package failed";
    exit 1
  fi
fi

# Build project
echo "Building project"
dotnet build EppoSDKRelay

echo "Publishing project"
dotnet publish

echo "Running Eppo SDK Relay"

# Pipe in parameters.
dotnet run --project EppoSDKRelay
