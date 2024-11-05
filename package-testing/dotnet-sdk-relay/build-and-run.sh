#!/usr/bin/env bash

if [ -e .env ]; then
  source .env
fi

# TODO: Substitute the specified version or REF of the SDK

dotnet build EppoSDKRelay
dotnet run --project EppoSDKRelay
