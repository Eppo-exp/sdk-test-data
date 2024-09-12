#!/usr/bin/env bash
source .env;
docker run --env-file ./.env \
  -p $SDK_RELAY_PORT:$SDK_RELAY_PORT \
  -e SDK_REF \
  -t Eppo/php-sdk-test
