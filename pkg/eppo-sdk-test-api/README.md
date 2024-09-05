# Eppo SDK Test Data Server

## Overview

The Eppo SDK test data server is a bare bones Express server which serves UFC and Bandit model data for testing SDK integrations. The test data server can change the data it serves to each calling SDK by mapping sdkName to a _Scenario_. A _Secenario_ is a collection of UFC data, Bandit model data, test cases and expected results all grouped together under a _label_. Using _Scenarios_ to test allows us to verify the caching and reloading behaviours of the SDKs.

## Test Scenario Configuration

The scenario configuration file, `scenarios.json` is located in the `pkg` directory of this repository and is copied into place for each service which requires it. By default, the first scenario listed will be served to any _sdkName_ that has not been explicitly mapped to a scenario label.

## Starting the server

### Installation and setup

1. Install NodeJS
2. Install Dependencies and copy shared testing data

```shell
yarn install
./copy-test-data.sh
```

1. Run the server

```shell
yarn dev
```

4. Navigate to [localhost:4000/flag-config/v1/config](localhost:4000/flag-config/v1/config) to verify UFC data is served.

### Customizing Server
The following options are exposed via environment variables

| Variable Name | Type | Default | Description |
| -- | -- | -- | -- |
| `EPPO_API_SERVER_PORT` | number | 5000 | The port for the server to listen on |
| `EPPO_TEST_DATA_PATH` | string | "test-data/" | Path to scenario file and test data relative to project root |
| `EPPO_SCENARIO_FILE` | string | "scenarios.json" | Path to the scenario definitions, must be located under `EPPO_TEST_DATA_PATH` |


These variables can be set in the `.env` file to be automatically loaded, `export`ed into the current shell, or prepended to the command line ex:

```shell
EPPO_API_SERVER_PORT=3333 yarn dev
```

## Getting data from the server

The server will respond with UFC and Bandit model config data at `/flag-config/v1/config` and `/flag-config/v1/bandits` just as the current Eppo API server does via CDN. The server will also populate the _E-TAG_ header and check the _IF-NONE-MATCH_ header and respond appropriately.

```shell
curl --location 'localhost:5000/flag-config/v1/config?sdkname=mySdkNAme' \
    --header 'IF-NONE-MATCH: oldconfigversion'

# See headers only

curl --location 'localhost:5000/flag-config/v1/config?sdkname=mySdkNAme' \
    --header 'IF-NONE-MATCH: oldconfigversion' -I

# Populate with the current etag and response is empty
curl --location 'localhost:5000/flag-config/v1/config?sdkname=mySdkNAme' \
    --header 'IF-NONE-MATCH: 79689d5810a263a40fc179be057e743d'


```
### Change test scenario

To change the scenario data for an SDK, send a **POST** request to the server at `/sdk/:sdkName/scenario` with the data `{"label": "scenarioLabel"}`. Example:

```shell
# Sets the scenario to "banditsDisabled" for the PHP SDK
curl --location 'localhost:5000/sdk/php-sdk/scenario' \
--header 'Content-Type: application/json' \
--data '{"label" : "banditsDisabled"}'
```

## Docker

### Running
To run in docker, we need to build the docker image, provide the test data, then run.

1. Build for lolal use
```shell
  docker build . -t Eppo-exp/test-api-server:local
```

To use the local copy of test data, run
```shell
./copy-test-data.sh
```

To use the test data at main, run
```shell
./clone-test-data.sh
```

Either of these scripts will populate the `test-data` directory with the files required to run the test API server. The last step is to run the docker container with a mounted volume to provide the test data files

```shell
docker run \
    --rm  \ # Removes volumes after shutdown
    -v ./test-data:/app/test-data \ # Mounts a volume for the test data
    -p 5000:5000 \ # forwards calls from locahost:5000 to port 5000 in the container
    -t Eppo-exp/test-api-server:local # runs the local image just built.
```

The SDK testing cluser requires an image for the test 

### Updating the app image
When the app is updated and a new version is required for testing in CI/CD pipelines, we need to make a new image available. This is done by building the image and then pushing it TODO:somewhere

```shell
docker build . -t Eppo-exp/test-api-server
```