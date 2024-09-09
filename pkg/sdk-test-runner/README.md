# Eppo SDK Package Test Runner
This app posts test cases to an SDK relay server and compares the results against the expected. It works in concert with a Scenario Api Server to test different groups of test cases against changing UFC and Bandit data.

## Running

## Testing a new SDK

The following components are required to use the the package test runner with a new SDK
1. An **SDK relay server**. This is a REST server running at `localhost:4000` resonding to the [Asssignment and Bandit Request API](#relay-server-api)
2. A `build.sh` file which, given a properly configured environment, [builds the SDK Relay Server application](#buildsh) **using the specified version of the SDK package**.
3. A `Dockerfile` to establish a portable environment in which to run the `build.sh` file. This image is pre-built and pulled just-in-time for running tests.
   1. If there are multiple environments in which to test the SDK, create `Dockerfile.<variant>` files as needed

The following are key components derived from above which allow for convenient and consistent dev-ops.
1. `release.sh` script to build and tag and push the docker image(s)
2. [stretch] Github workflow and `secrets` required to run the `release.sh` command in Github. 

Finally, these are the advanced items to integrate the new package test into our CI pipelines
1. Github Action to run test configured for SDK (TODO: Create example)
2. Github workflows (in SDK repository and `sdk-test-data` repository) to run the test. (TODO: create example)

### Relay Server API
The testing cluster spins up an API server at the default address, `localhost:5000`. This address is set in the `EPPO_API_SERVER` environment variable . This server address must be used to initialize the `EppoClient` in the relay server. The Relay server is typically expected to run at `locahost:4000`, and this address is specified in the `SDK_RELAY_SERVER` environment variable.


#### Flags / UFC Assignment
```ts
// POSTed to `/flags/v1/assignment`
type Assignment = {
  flag: string;
  subjectKey: string;
  variationType: string;
  defaultValue: object;
  subjectAttributes: Record<string, object>;
};

// Expects result:
export type TestResponse {
    result?: Object,          // Relayed `EppoClient` response
    assignmentLog?: Object[], // Assignment log events (not yet tested)
    banditLog?: Object[],     // Bandit selection log events (not yet tested)
    error?: string            // Error encountered (not yet tested; automatically fails test when present)
}
```

#### Bandits
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
  
// Expects result:
export type TestResponse {
    result?: Object,          // Relayed `EppoClient` response, form of {variation: string, action: string}
    assignmentLog?: Object[], // Assignment log events (not yet tested)
    banditLog?: Object[],     // Bandit selection log events (not yet tested)
    error?: string            // Error encountered (not yet tested; automatically fails test when present)
}
```


### build.sh
The `build.sh` file is responsible for building a deployable/executable for the SDK relay server based on the specified version of the SDK. The version can be specified by tag, commit SHA, or branch. The version is specified through the `SDK_REF` environment variable.

Example `build.sh` script

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

### Dockerfile
The `Dockerfile` configures the environment needed to build and run the SDK relay server.
Example
```dockerfile
FROM php:8.1

# dependencies needed for composer (and for build.sh).
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip


COPY --from=composer /usr/bin/composer /usr/bin/composer

WORKDIR /relayapp

COPY . .

COPY --chmod=755 build.sh /

RUN composer install

EXPOSE 4000

CMD ["/build.sh"]
```


## Configuration

### via `.env`

```shell
TEST_CASE_FILE="../testconfig.json"
SDK_SERVER_HOST="http://localhost"
SDK_SERVER_PORT=4000
API_SERVER_HOST="http://localhost"
API_SERVER_PORT=5000
```

### via command line
```shell
SDK_NAME=php-sdk yarn dev
```

```shell
./test-sdk.sh server php-sdk main
```


## SDK Testing implementations

To test an SDK, implement the following
- create directory `pkg/<sdk-name>`
- relay server to answer test cases (see schema)
- build.sh file to checkout the target sdk repo at a specific ref (branch, SHA, tag), build the production artifact and then bundle it into the Relay server
- Dockerfile to set up environment to make build.sh portable
- run `docker build -t Eppo-exp/<sdk-name>-relay` to build the docker image to be used by the test runner

## Additional Configuration
### Environment Variables
The following variables can be set on the test runner program

TEST_CASE_FILE
LOG_PREFIX

The following env variables can be set when running the `test-sdk.sh` script

| Variable Name | Type | Default | Description |
| SDK_REF | String | main | Branch/Tag/SHA for SDK to test |
| TEST_DATA_REF | String | null | Branch/Tag/SHA for test data to use, local data is used when value is empty/unset |

