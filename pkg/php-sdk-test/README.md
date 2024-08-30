# PHP Testing Server

Post test case files to this server and check the results against what's expected.

## Setup
Open `.env.EXAMPLE`, set your favourite configs and then save it as `.env`

## Running

### Locally

```shell
BASH_ENV=.env SDK_REF=<your branch/tag/SHA> ./build.sh
```

### With Docker
#### Build Docker Image
```shell
docker build -t Eppo/php-sdk-test .
```

#### Run the docker container
```shell
docker run -p $PHP_TEST_SERVER_PORT:$PHP_TEST_SERVER_PORT -t Eppo/php-sdk-test --env-file ./.env -e SDK_REF=<your branch/tag/SHA>
```