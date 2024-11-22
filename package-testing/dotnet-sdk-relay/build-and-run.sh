#!/usr/bin/env bash

# default version of the SDK to use.
: "${SDK_VERSION:=3.5.0}"

SDK="https://github.com/Eppo-exp/dot-net-server-sdk.git"


if [ -e .env ]; then
  source .env
fi

# No need to configure the environment; GH Runners all have .NET installed.

# Inject desired SDK version
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
  popd

  echo "Adding local dependency"
  cd EppoSDKRelay
  dotnet restore
  dotnet add package Eppo.Sdk --source ../tmp/dot-net-sdk/bin/Release/
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

cd EppoSDKRelay
dotnet build

echo "Publishing project"
dotnet publish

echo "Running Eppo SDK Relay"

# Pipe in parameters.
dotnet run
