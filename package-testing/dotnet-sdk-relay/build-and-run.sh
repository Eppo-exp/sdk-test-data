#!/usr/bin/env bash

# One of macos, ubuntu, windows
PLATFORM=${PLATFORM:=ubuntu}
DOTNET_VERSION="8.0"

if [ -e .env ]; then
  source .env
fi


# Configure environment to **build** the app

# Github runners use the package managers below
# https://github.com/actions/runner-images
case "${PLATFORM}" in
    "windows")
        choco install dotnet-sdk -v ${DOTNET_VERSION}
        ;;
    "macos")
        brew install dotnet-sdk@${DOTNET_VERSION}
        ;;
    "ubuntu")
        sudo apt update
        sudo apt install dotnet-sdk-${DOTNET_VERSION}
        ;;
    *)
        echo "Unsupported platform: ${PLATFORM}"
        exit 1
        ;;
esac



# Inject desired SDK version

dotnet build EppoSDKRelay
dotnet publish
  


# Configure environment to **run** the app
case "${PLATFORM}" in
    "Windows")
        choco install dotnet-runtime -v ${DOTNET_VERSION}
        ;;
    "Darwin")
        brew install dotnet
        ;;
    "Linux")
        sudo apt update
        sudo apt install dotnet
        ;;
    *)
        echo "Unsupported platform: ${PLATFORM}"
        exit 1
        ;;
esac



dotnet run --project EppoSDKRelay
