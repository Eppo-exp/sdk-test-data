# Ruby Testing Server

Post test case files to this server and check the results against what's expected.

## Running locally with Docker

Build the docker image:

```shell
docker build -t Eppo-exp/ruby-sdk-relay .
```

Run the docker container:

```shell
./docker-run.sh
```

## Development

1. Install dependencies:
```shell
bundle install
```

2. Run the server:
```shell
ruby src/server.rb
``` 