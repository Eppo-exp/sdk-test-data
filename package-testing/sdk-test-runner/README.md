# Eppo SDK Package Test Runner

This app posts test cases to an SDK relay server and compares the results against the expected. It works in concert with a Scenario Api Server to test different groups of test cases against changing UFC and Bandit data.

## Running

The easiest way to use the test runner is the wrapper script, `./test-sdk.sh`. It sets most configuration values and handles spinning up the test API server, the SDK relay server, and starting the test runner app.

```shell
./test-sdk.sh server <server_sdk_name> <sdk_ref> <test_data_branch>
```

### via command line

If you need to run the app in dev mode, first spin up a testing API and the desired SDK relay, then run dev mode:

```shell
docker run \
    --rm -d \
    -v ./test-data:/app/test-data \
    -p 5000:5000 \
    -t Eppo-exp/test-api-server:local

../<SDK_DIR>/build-and-run.sh

SDK_NAME=eppo/php-sdk yarn dev
```

#### Command line arguments

`--junit=<filepath>` records results in junit xml format to specified file

#### Test Runner Configuration

Environment variables can be set in shell, or in a `.env` file.

| Variable Name         | Type   | Default          | Description                                 |
| --------------------- | ------ | ---------------- | ------------------------------------------- |
| `EPPO_TEST_DATA_PATH` | string | `./test-data`    | Base path for test case files               |
| `EPPO_SCENARIO_FILE`  | string | `scenarios.json` | Spec file for test scenarios and test cases |
| `SDK_RELAY_HOST`      | string | `localhost`      | Hostname for relay server                   |
| `SDK_RELAY_PORT`      | number | 4000             | Port for relay server                       |
| `EPPO_API_HOST`       | string | `localhost`      | Hostname for api server                     |
| `EPPO_API_PORT`       | number | 5000             | Port for api server                         |

The following env variable can be set when running the `test-sdk.sh` script

| Variable Name | Type   | Default | Description                                                                  |
| ------------- | ------ | ------- | ---------------------------------------------------------------------------- |
| `SDK_DIR`     | string | 'main'  | Directory of the SDK relay server, if not equal to "<server_sdk_name>-relay" |

## Testing a new SDK

The following components are required to use the the package test runner with a new SDK

1. An **SDK relay server**. This is a REST server running at `localhost:4000` resonding to the [Asssignment and Bandit Request API](#sdk-relay-server)
2. A `build-and-run.sh` file which, given a properly configured environment, [builds the SDK Relay Server application](#build-and-runsh) **using the specified version of the SDK package**.

The following are key components derived from above which allow for convenient and consistent dev-ops.

1. `release.sh` script to build and tag and push the docker image(s)
2. [stretch] Github workflow and `secrets` required to run the `release.sh` command in Github.

Finally, these are the advanced items to integrate the new package test into our CI pipelines

1. Github Action to run test configured for SDK (TODO: Create example)
2. Github workflows (in SDK repository and `sdk-test-data` repository) to run the test. (TODO: create example)

### SDK Relay Server

The test runner sends assignment and bandit action requests to the SDK Relay Server which calls `EppoClient` and returns the results to the test runner. The paths and data packets are outlined below in [API](#api). Environment variables set the host and port for the Relay Server to listen on as well as the Eppo API server and port (for `EppoClient` initialization). For development of the SDK Relay server, start a local copy of the [Test API Server](../testing-api/) to serve the flag/bandit configuration, then use this handy [Postman workspace](https://www.postman.com/material-meteorologist-42730907/typotter-eppo/collection/5bjhdzy/relay-server-testing?action=share&creator=38014089) to issue requests to the relay server without having to blast it with the test runner.

#### Configuration

| Variable Name    | Type   | Description               | Default     |
| ---------------- | ------ | ------------------------- | ----------- |
| `SDK_RELAY_HOST` | string | Hostname for relay server | `localhost` |
| `SDK_RELAY_PORT` | number | Port for relay server     | 4000        |
| `EPPO_API_HOST`  | string | Hostname for api server   | `localhost` |
| `EPPO_API_PORT`  | number | Port for api server       | 5000        |

#### API

##### Ready check

`GET /`

Any non-empty response

##### Reset SDK

`POST /sdk/reset`

The SDK needs to be forced to reload its configuration from the server from time to time. Some SDKs allow for the caches to be expired externally, others allow for a forced refresh, and some offer neither. The preference for implentations of this method is to simulate the SDK naturally reloading configuration (whether through a timed out cache, poller etc) _as close as possibly_. The mechanism priority should be

1. expire caches
2. force refresh
3. force reinitialization

Any non-empty response is requred

##### Flags / UFC Assignment

`POST /flags/v1/assignment`

```ts
// POSTed to `/flags/v1/assignment`
type Assignment = {
  flag: string;
  subjectKey: string;
  assignmentType: string;
  defaultValue: object;
  subjectAttributes: Record<string, object>;
};

// Expect response data:
export type TestResponse {
    result?: Object,          // Relayed `EppoClient` response
    assignmentLog?: Object[], // Assignment log events (not yet tested)
    banditLog?: Object[],     // Bandit selection log events (not yet tested)
    error?: string            // Error encountered (not yet tested; automatically fails test when present)
}
```

##### Bandits

`POST /bandits/v1/action`

```ts
// POSTed to `/bandits/v1/action`
export type BanditActionRequest = {
    flag: string;
    subjectKey: string;
    defaultValue: object;
    /**
     * {
     *   numericAttributes: { ... },
     *   categoricalAttributes: { ... }
     * }
     */
    subjectAttributes: Record<string, object>;
    /**
     * {
     *   action1: {
     *     numericAttributes: { ... },
     *     categoricalAttributes: { ... }
     *   },
     *   action2: { ... }
     * }
     */
    actions: Record<string, object>;
  };

// Expects response data:
export type TestResponse {
    result?: Object,          // Relayed `EppoClient` response, form of {variation: string, action: string}
    assignmentLog?: Object[], // Assignment log events (not yet tested)
    banditLog?: Object[],     // Bandit selection log events (not yet tested)
    error?: string            // Error encountered (not yet tested; automatically fails test when present)
}
```

### build-and-run.sh

The `build-and-run.sh` file is responsible for building a deployable/executable for the SDK relay server based on the specified version of the SDK. The version can be specified by tag, commit SHA, or branch. The version is specified through the `SDK_REF` environment variable.

Example `build-and-run.sh` script

```shell

#!/usr/bin/env bash

composer install

# Set default values for vars

: "${SDK_REF:=main}"
: "${SDK_RELAY_HOST:=localhost}"
: "${SDK_RELAY_PORT:=4000}"
SDK="https://github.com/Eppo-exp/php-sdk.git"


# checkout the specified ref of the SDK repo, build it, and then insert it into vendors here.
mkdir -p tmp

echo "Cloning ${SDK}@${SDK_REF}"
git clone -b ${SDK_REF} --depth 1 --single-branch ${SDK} tmp

# overwrite vendor files
cp -Rf tmp/. ./vendor/eppo/php-sdk/
rm -Rf tmp

# Run the poller
php src/eppo_poller.php &

echo "Listening on ${SDK_RELAY_HOST}:${SDK_RELAY_PORT}"

# Run using PHP's built-in web server.
php -S "${SDK_RELAY_HOST}:${SDK_RELAY_PORT}" -t src
```

# Development

## Test Runner

### Running locally

- Requires a TEST API Server and an SDK Relay Server to be running
- Then, launch the test runner

```sh
docker build . -t Eppo-exp/sdk-test-runner
docker run --name test-runner -e SDK_NAME -t Eppo-exp/sdk-test-runner
```
