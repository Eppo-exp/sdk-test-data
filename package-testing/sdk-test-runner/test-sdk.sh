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

# Wait for a server to be ready
# Returns 1 when the server is available; 0 if not available within max retries of 30.
function wait_for_url() {
  local url="$1"
  local max_attempts=30
  local attempt=1

  while [[ $attempt -le $max_attempts ]]; do
    curl --silent --output /dev/null --fail "$url" && { return 1; }
    sleep 1
    ((attempt++))
  done

  return 0
}

function exit_with_message() {
  echo_red "$1"
  exit 1
}

# Parse command-line arguments
command="$1"
export SDK_NAME="$2"
export SDK_REF="${3:-main}"

if [ -e .env ]; then
  source .env
fi

# Allow env variables to be overwritten, then export to this shell.
export EPPO_API_HOST="${EPPO_API_HOST:-localhost}"
export EPPO_API_PORT="${EPPO_API_PORT:-5000}"

export SDK_RELAY_HOST="${SDK_RELAY_HOST:-localhost}"
export SDK_RELAY_PORT="${SDK_RELAY_PORT:-4000}"

export EPPO_SCENARIO_FILE="${EPPO_SCENARIO_FILE:-scenarios.json}"
export EPPO_TEST_DATA_PATH="${EPPO_TEST_DATA_PATH:-./test-data}"


# Validate SDK name
if [[ -z "$SDK_NAME" ]]; then
  exit_with_message "Missing required argument: sdkName"
fi

# Extrapolate the SDK directory name
if [[ -z "$SDK_DIR" ]]; then
  SDK_DIR=${SDK_NAME}-relay
fi
export SDK_DIR


# Get the test data and scenario file ready for the test servers
if [[ -n "$TEST_DATA_REF" ]]; then
    # TODO this
    exit_with_message "Getting test data from repository by ref is not yet supported"
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

        echo "  ... Starting Test Cluster node [Eppo-exp/test-api-server]"

        docker run \
          -e EPPO_API_HOST \
          -e EPPO_API_PORT \
          -e EPPO_SCENARIO_FILE \
          -e EPPO_TEST_DATA_PATH=./test-data \
          -p ${EPPO_API_PORT}:${EPPO_API_PORT} \
          -v ./test-data:/app/test-data:ro \
          --rm -d \
          --name eppo-api \
          -t Eppo-exp/test-api-server:latest

        echo_yellow "    ... Waiting to verify server is up"

        wait_for_url http://${EPPO_API_HOST}:${EPPO_API_PORT} 
        if [[ $? -eq 0 ]]; then
          exit_with_message "    ... Test API Server failed to start"
        fi
        echo_green "    ... Test API Server has started "
       
        echo "  ... Starting Test Cluster node [${SDK_DIR}]"

        # change directory to the SDK relay then build-and-run
        RUNNER_DIR=$(pwd)
        pushd ../$SDK_DIR
        ./build-and-run.sh >> ${RUNNER_DIR}/logs/sdk.log 2>&1 &
        SDK_RELAY_PID=$!
        popd


        echo_yellow "    ... Waiting to verify server is up"
        wait_for_url http://${SDK_RELAY_HOST}:${SDK_RELAY_PORT} 
        if [[ $? -eq 0 ]]; then
          exit_with_message "    ... SDK Relay server failed to start"
        fi
        echo_green "    ... SDK Relay server has started"

        echo "  ... Starting Test Cluster node [Eppo-exp/sdk-test-runner]"
        
        docker run \
          -e SDK_NAME \
          -e EPPO_API_HOST=host.docker.internal \
          -e SDK_RELAY_HOST=host.docker.internal \
          -e EPPO_API_PORT \
          -v ./logs:/app/logs \
          --name eppo-sdk-test-runner \
          -t Eppo-exp/sdk-test-runner:latest "--junit=logs/results.xml"


        echo "  ... Downing the docker containers"
        docker logs eppo-api >& logs/api.log
        docker stop eppo-api
        

        docker logs eppo-sdk-test-runner >& logs/test_runner.log
        docker container remove eppo-sdk-test-runner #already stopped at this point

        pkill -P $SDK_RELAY_PID
        
        ;;
    client)
        echo_red "Client mode not yet implemented"
        exit 1;
        ;;
    *)
        echo_red "Invalid command: $command"
        exit 1
        ;;
esac
