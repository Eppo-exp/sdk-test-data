#!/usr/bin/env bash

# Set default values for vars
: "${SDK_RELAY_HOST:=0.0.0.0}"
: "${SDK_RELAY_PORT:=4000}"
: "${EPPO_API_KEY:=test-api-key}"
: "${EPPO_BASE_URL:=http://localhost:5000/api}"

echo "Building Java Server SDK Relay"

# Build the relay server
./gradlew clean build copyDependencies

# Export environment variables for the relay server
export SDK_RELAY_HOST
export SDK_RELAY_PORT
export EPPO_API_KEY
export EPPO_BASE_URL

echo "Starting relay server on ${SDK_RELAY_HOST}:${SDK_RELAY_PORT}"
echo "Using Eppo API at ${EPPO_BASE_URL}"

# Run the application
java -cp "build/libs/*:build/libs/dependencies/*" cloud.eppo.relay.RelayServer
