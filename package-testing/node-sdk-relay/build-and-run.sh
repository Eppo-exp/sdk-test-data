#!/usr/bin/env bash

# Set default values for vars
: "${SDK_REF:=main}"
: "${SDK_RELAY_HOST:=localhost}"
: "${SDK_RELAY_PORT:=4000}"
SDK="https://github.com/Eppo-exp/node-server-sdk.git"

# Run the poller
yarn install
echo "Listening on port ${SDK_RELAY_PORT}"
yarn start:prod
