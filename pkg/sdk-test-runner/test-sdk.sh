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

# Fun colours
function echo_red() {
  echo -e "\033[0;31m$1\033[0m"
}

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
    echo "... Getting test data from the local filesystem."
    rm -Rf test-data
    mkdir test-data
    cp -R ../../ufc test-data/
    cp ../scenarios.json test-data/
fi

# The data directory will be mounted for the docker containers in docer-compose


# Set up server or client (TODO) test runs
case "$command" in
    server)
        echo "... Running test scenarios against $SDK_NAME@$SDK_REF in server mode"
        if [ -d "../${SDK_NAME}" ]; then
          export SDK_IMG=Eppo-exp/${SDK_NAME}-relay
          echo "  ... Starting Docker cluster [Eppo-exp/test-api-server, ${SDK_IMG}]"
          docker-compose -f docker-compose.yml up -d
          if [ $? -eq 0 ]; then
            echo "    ... Docker cluster up"
          else
            echo_red "    ... Docker cluster failed to start"
            exit 1
          fi

          # Verify servers are running
          echo "    ... Sleeping 5secs to verify servers are up"
          sleep 5

          for container in "Eppo-exp/test-api-server" "${SDK_IMG}"; do
            echo "checking $container"
            if docker ps | grep $container | grep "Up"; then
                echo "    ... $container is running."
            else
                echo_red "    ... $container is not running."
                #docker-compose down
                exit 1;
            fi
          done

          # starts the test runner using env vars set @ top.
          echo "  ... Starting the test runner app"
          LOG_PREFIX="    ... " yarn dev

          echo "  ... Downing the docker containers"
          docker-compose down
        else
          echo_red "  ... Invalid SDK ${SDK_NAME} specified";
        fi
        ;;
    client)
        echo "Client mode not implemented"
        exit 1;
        ;;
    *)
        echo_red "Invalid command: $command"
        exit 1
        ;;
esac