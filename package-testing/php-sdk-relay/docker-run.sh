#!/usr/bin/env bash

# Default is to use the latest build
VERSION="${1:-latest}"

if [ -e .env ]; then
  source .env
fi

docker stop php-relay
docker remove php-relay
docker run  -p $SDK_RELAY_PORT:$SDK_RELAY_PORT \
  -e SDK_REF \
  -e SDK_RELAY_PORT \
  --name php-relay \
  -d --rm \
  -t Eppo-exp/php-sdk-relay:$VERSION && \
  echo "Container running"
