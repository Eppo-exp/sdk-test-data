#!/usr/bin/env bash

# Default is to use the latest build
VERSION="${1:-latest}"

if [ -e .env ]; then
  source .env
fi

docker stop python-relay
docker remove python-relay

docker build . -t Eppo-exp/python-sdk-relay:$VERSION

docker run -p $SDK_RELAY_PORT:$SDK_RELAY_PORT \
  --add-host host.docker.internal:host-gateway \
  -e SDK_REF \
  -e EPPO_BASE_URL \
  -e SDK_RELAY_PORT \
  --name python-relay \
  -d --rm \
  -t Eppo-exp/python-sdk-relay:$VERSION && \
  echo "Container running"
