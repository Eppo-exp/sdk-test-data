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
