# .NET SDK Relay Server

Post test case files to this server and check the results against what's expected.

## Setup
Open `.env.EXAMPLE`, set appropriate config values and then save it as `.env`

## Running

### Locally

```shell
SDK_REF=<your branch/tag/SHA> ./build-and-run.sh
```

### On a Fresh Machine

Instead of packaging in a docker container, the .NET relay uses a shell script to prepare the system to build and run. Set the `EPPO_SDK_PLATFORM` environment variable to one of `macos`,`linux`,`windows`.

```shell
EPPO_SDK_PLATFORM=macos ./build-and-run.sh
```

## Development

### Testing the relay server

Use this [Postman collection](https://www.postman.com/material-meteorologist-42730907/typotter-eppo/collection/5bjhdzy/relay-server-testing)
