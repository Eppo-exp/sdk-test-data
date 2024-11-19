# Eppo SDK Test Data Server

## Overview

The Eppo SDK test data server is a bare-bones Express server which serves UFC and Bandit model data for testing SDK integrations. The test data server can change the data it serves to each calling SDK by mapping `sdkName` to a _Scenario_. A _Secenario_ is a collection of UFC data, Bandit model data, test cases and expected results all grouped together under a _label_. Using _Scenarios_ to test allows us to verify the caching and reloading behaviours of the SDKs.

It does not currently support serving obfuscated configuration.

## Test Scenario Configuration

The scenario configuration file, `scenarios.json` is located in the `package-test` directory of this repository and is copied into place by the `copy-test-data.sh` helper script. By default, the first scenario listed will be served to any _sdkName_ that has not been explicitly mapped to a scenario label.

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

yarn start:prod

# Or, run in dev mode
yarn dev
```

4. Navigate to [localhost:4000/api/flag-config/v1/config](http://localhost:4000/api/flag-config/v1/config) to verify UFC data is served.

### Customizing Server
The following options are exposed via environment variables

| Variable Name         | Type      | Default           | Description |
| -- | -- | -- | -- |
| `EPPO_API_PORT`       | number    | 5000              | The port for the server to listen on |
| `EPPO_TEST_DATA_PATH` | string    | "test-data/"      | Path to scenario file and test data relative to project root |
| `EPPO_SCENARIO_FILE`  | string    | "scenarios.json"  | Filepath to the scenario definitions, relative to `EPPO_TEST_DATA_PATH` |


These variables can be set in the `.env` file to be automatically loaded, `export`ed into the current shell, or prepended to the command line ex:

```shell
EPPO_API_SERVER_PORT=3333 yarn dev
```

## Getting data from the server

The server will respond with UFC and Bandit model config data at `/api/flag-config/v1/config` and `/api/flag-config/v1/bandits` just as the current Eppo API server does via CDN. The server will also populate the _ETAG_ header and check the _IF-NONE-MATCH_ header and respond appropriately.

```shell
curl --location 'localhost:5000/api/flag-config/v1/config?sdkName=fortran-sdk'

# Get Bandits
curl --location 'localhost:5000/api/flag-config/v1/bandits?sdkName=fortran-sdk' 

# See headers only
curl --location 'localhost:5000/api/flag-config/v1/config?sdkName=fortran-sdk' -I

# Populate IF-NONE-MATCH with the current etag to verify empty response
curl --location 'localhost:5000/api/flag-config/v1/config?sdkName=fortran-sdk' \
    --header 'IF-NONE-MATCH: 79689d5810a263a40fc179be057e743d'

# Show just the headers to see response code 304:not modified
curl --location 'localhost:5000/api/flag-config/v1/config?sdkName=fortran-sdk' \
    --header 'IF-NONE-MATCH: 79689d5810a263a40fc179be057e743d' -I


```
### Change test scenario

To change the scenario data for an SDK, send a **POST** request to the server at `/sdk/:sdkName/scenario` with the data `{"label": "scenarioLabel"}`. Example:

```shell
# Sets the scenario to "banditsDisabled" for the fortran-sdk
curl --location 'localhost:5000/sdk/fortran-sdk/scenario' \
--header 'Content-Type: application/json' \
--data '{"label" : "banditsDisabled"}'
```

## Docker

### Running
To run in docker, we need to build the docker image, provide the test data, then run.

1. Build for local use
```shell
  docker build . -t Eppo-exp/testing-api:local
```

To use the local copy of test data, run
```shell
./copy-test-data.sh
```

To use the test data from the repository with a specific ref, use
```shell
# usage ./clone-test-data.sh <GIT_REF>
./clone-test-data.sh track/tp/feat

```

Either of these scripts will populate the `test-data` directory with the files required to run the test API server. The last step is to run the docker container with a mounted volume to provide the test data files

```shell
docker run \
    --rm  \
    -v ./test-data:/app/test-data \
    -p 5000:5000 \
    -t Eppo-exp/testing-api:local
```


### Updating the app image
The SDK testing cluster requires a docker image be builts and pushed to the cloud.
When the app is updated and a new version is required for testing in CI/CD pipelines, we need to make a new image available. This is done by building the image and then pushing it TODO: to Github Artifact Registry

```shell
./release.sh <version_tag>
```
