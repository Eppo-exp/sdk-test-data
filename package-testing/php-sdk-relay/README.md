# PHP Testing Server

Post test case files to this server and check the results against what's expected.

## Setup
Open `.env.EXAMPLE`, set appropriate config values and then save it as `.env`

## Running

### Locally

```shell
BASH_ENV=.env SDK_REF=<your branch/tag/SHA> ./build-and-run.sh
```

### With Docker
#### Build Docker Image
```shell
docker build -t Eppo-exp/php-sdk-relay .
```

#### Run the docker container
```shell
./docker-run.sh
```

## Development

### Running locally

```shell
php -S localhost:4000 src/index.php
```

### Build and Tag a new version
_nb: not really needed as this target will need to be built on every run of the test cluster against this SDK, but
useful for development along the way nonetheless_

```shell
./release.sh <version>
```
