# Eppo Java Server SDK Relay

This relay server connects to the Eppo Package Test Runner and relays assignment requests to the Eppo Java Server SDK.

## Requirements

- Java 11 or higher
- Gradle 7.x or higher

## Running

Build and run the relay server:

```shell
./build-and-run.sh
```

The server will start on `localhost:4000` by default.

## Environment Variables

| Variable Name    | Type   | Default                     | Description                          |
| ---------------- | ------ | --------------------------- | ------------------------------------ |
| `SDK_RELAY_HOST` | string | `localhost`                 | Hostname for relay server            |
| `SDK_RELAY_PORT` | number | 4000                        | Port for relay server                |
| `EPPO_BASE_URL`  | string | `http://localhost:5000/api` | Base URL for Eppo API                |
| `EPPO_API_KEY`   | string | `test-api-key`              | API key for Eppo                     |

## SDK

This relay uses `cloud.eppo:eppo-server-sdk` version `5.3.4` from Maven Central. The SDK version is pinned in `build.gradle`.

## Endpoints

- `GET /` - Health check
- `GET /sdk/details` - SDK information
- `POST /flags/v1/assignment` - Get feature flag assignment
- `POST /bandits/v1/action` - Get bandit action
- `POST /sdk/reset` - Reset and reinitialize the SDK
