# Go Testing Server

Post test case files to this server and check the results against what's expected.

## Running locally with Docker

Build the docker image:

```shell
docker build -t Eppo-exp/go-sdk-relay .
```

Run the docker container:

```shell
./docker-run.sh
```

## Development

1. Install dependencies:
```shell
go mod download
```

2. Run the server:
```shell
go run main.go
```
