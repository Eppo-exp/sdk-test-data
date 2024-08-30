#!/usr/bin/env bash
source .env;
docker run --env-file ./.env \
  -p $PHP_TEST_SERVER_PORT:$PHP_TEST_SERVER_PORT \
  -e SDK_REF \
  -t Eppo/php-sdk-test
