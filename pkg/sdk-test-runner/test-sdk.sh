#!/bin/bash

# Usage:
#
# test-sdk.sh <command> <sdkName> [sdkRef]
#
# Commands:
#   server - Runs the package test scenarios against an SDK server
#   client - TODO: Runs the package test scenarios using and SDK client test runner.
#
# Arguments:
#   <command>        Required. Specifies the command to execute (server or client).
#   <sdkName>       Required. The name of the SDK; corresponds to subpackage name.
#   [sdkRef]        Optional. The reference of the SDK (default: main).
#
# Environment Overrides:

# Parse command-line arguments
command="$1"
export SDK_NAME="$2"
export SDK_REF="${3:-main}"

TEST_CASE_FILE="../testconfig.json"

export SDK_RELAY_PORT="${SDK_RELAY_PORT:-4000}"
export API_SERVER_PORT_PORT="${API_SERVER_PORT_PORT:-5000}"

SDK_RELAY_SERVER="http://localhost:4000"
EPPO_API_SERVER="http://localhost:5000"

# Validate SDK name
if [[ -z "$SDK_NAME" ]]; then
    echo "Missing required argument: sdkName"
    exit 1
fi

echo "Relay port $SDK_RELAY_PORT"

# Get the test data and scenario file ready for the test servers
if [[ -n "$TEST_DATA_REF" ]]; then
    # TODO this
    echo "Getting test data by ref is not yet supported"
else
    # Copy the local test data into temp dir to be mounted to the test data server and the test runner
    rm -Rf data
    mkdir data
    cp -R ../../ufc data/
    cp ../scenarios.json data/
fi

# The data directory will be mounted for the docker containers
export SCENARIOS_FILE="data/scenarios.json"

# Set up server or client (TODO) test runs
case "$command" in
    server)
        echo "... Running test scenarios against $SDK_NAME@$SDK_REF in server mode"
        if [ -d "../${SDK_NAME}" ]; then
          export SDK_IMG=Eppo-exp/${SDK_NAME}-relay
          echo "  ... Starting Docker cluster [Eppo-exp/test-api-server, ${SDK_IMG}]"
          docker-compose -f docker-compose.yml up
          
          # starts the test runner using env vars set @ top.
          echo "  ... Starting the test runner app"
          LOG_PREFIX="    ... " yarn dev


        else
          echo "  ... Invalid SDK ${SDK_NAME} specified";
        fi
        ;;
    client)
        echo "Client mode not implemented"
        exit 1;
        ;;
    *)
        echo "Invalid command: $command"
        exit 1
        ;;
esac