# Eppo SDK Test Data Server

## Overview

The Eppo SDK test data server is a bare bones Express server which serves UFC and Bandit model data for testing SDK integrations. The test data server can change the data it serves to each calling SDK by mapping sdkName to a _Scenario_. A _Secenario_ is a collection of UFC data, Bandit model data, test cases and expected results all grouped together under _label_. Using _Scenarios_ to test allows us to verify the caching and reloading behaviours of the SDKs.

## Test Scenario Configuration

The scenario configuration files and test case files are specified in `scenario_config.json`. By default, the first scenario listed will be served to any _sdkName_ that does not appear in the data file map. The data file map can be specified on startup by declaring a map of `sdkName` : `scenarioLabel` in the `initialClientMap` section of the config.

## Starting the server

### Installation and setup

1. Install NodeJS
2. Install Dependencies

```sh
yarn install
```

3. Run the server

```sh
yarn dev
```

4. Navigate to [localhost:4000/flag-config/v1/config](localhost:4000/flag-config/v1/config) to verify UFC data is served.

### Customizing Server

You can specify the port for the test data server to listen on by setting the env variable `EPPO_SDK_TEST_SERVER_PORT`. You can do this by either setting the value in your `.env` file (see `.env.EXAMPLE` for instructions on setting this up), or by setting the env variable in your command, ex:

```sh
EPPO_SDK_TEST_SERVER_PORT=5000 yarn dev
```

## Getting data from the server

The server will respond with UFC and Bandit model config data at `/flag-config/v1/config` and `/flag-config/v1/bandits` just as the current Eppo API server does via CDN. The server will also populate the _E_TAG_ header and check the _IF_NONE_MATCHES_ header and respond appropriately.

### Change test scenario

To change the scenario data for an SDK, send a **POST** request to the server at `/sdk/:sdkName/scenario` with the data `{"label": "scenarioLabel"}`. Example:

```sh
# Sets the scenario to "banditsDisabled" for the PHP SDK
curl --location 'localhost:3333/sdk/php-sdk/scenario' \
--header 'Content-Type: application/json' \
--data '{"label" : "banditsDisabled"}'
```

## Running in Docker.

TODO THIS
