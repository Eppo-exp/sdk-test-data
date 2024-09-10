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

# Fun colours
function echo_red() {
  echo -e "\033[0;31m$1\033[0m"
}

function echo_green() {
  echo -e "\033[0;32m$1\033[0m"
}

function echo_yellow() {
  echo -e "\033[0;33m$1\033[0m"
}

# Parse command-line arguments
command="$1"
export SDK_NAME="$2"
export SDK_REF="${3:-main}"

# Allow env variables to be overwritten, then export to this shell.
export EPPO_API_HOST="${EPPO_API_HOST:-localhost}"
export EPPO_API_PORT="${EPPO_API_PORT:-5000}"

export SDK_RELAY_HOST="${SDK_RELAY_HOST:-localhost}"
export SDK_RELAY_PORT="${SDK_RELAY_PORT:-4000}"

export EPPO_SCENARIO_FILE="${EPPO_SCENARIO_FILE:-scenarios.json}"
export EPPO_TEST_DATA_PATH="${EPPO_TEST_DATA_PATH:-./test-data}"


# Validate SDK name
if [[ -z "$SDK_NAME" ]]; then
    echo_red "Missing required argument: sdkName"
    exit 1
fi

# Extrapolate an SDK container image.
if [[ -z "$SDK_IMG" ]]; then
  SDK_IMG=Eppo-exp/${SDK_NAME}-relay
fi
export SDK_IMG
# TODO: pull SDK relay server and api-server image from the Google Artifavt Registry

# Get the test data and scenario file ready for the test servers
if [[ -n "$TEST_DATA_REF" ]]; then
    # TODO this
    echo_red "Getting test data from repository by ref is not yet supported"
    exit 1
else
    # Copy the local test data into temp dir to be mounted to the test data server and the test runner
    echo "... Getting test data from the local filesystem."
    rm -Rf test-data
    mkdir test-data
    cp -R ../../ufc test-data/
    cp ../scenarios.json test-data/
fi


case "$command" in
    server)
        echo "... Running test scenarios against $SDK_NAME@$SDK_REF in server mode"

        echo "  ... Starting Docker cluster [Eppo-exp/test-api-server, ${SDK_IMG}]"

        docker-compose -f docker-compose.yml up -d

        if [ $? -eq 0 ]; then
          echo_green "    ... Docker cluster up"
        else
          echo_red "    ... Docker cluster failed to start"
          exit 1
        fi

        # Verify servers are running
        echo_yellow "    ... Sleeping 5secs to verify servers are up"
        sleep 5

        for container in "Eppo-exp/test-api-server" "${SDK_IMG}"; do
          if [[ "$(docker ps | grep "$container" | grep "Up")" ]]; then
              echo_green "    ... $container is running."
          else
              echo_red "    ... $container is not running."
              docker-compose down
              exit 1;
          fi
        done

        # starts the test runner using env vars set @ top.
        echo "  ... Starting the test runner app"
        LOG_PREFIX="    ... " yarn dev

        echo_yellow "  ... Downing the docker containers"
        docker-compose down
        ;;
    client)
        echo_red "Client mode not implemented"
        exit 1;
        ;;
    *)
        echo_red "Invalid command: $command"
        exit 1
        ;;
esac