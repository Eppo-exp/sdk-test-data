#!/usr/bin/env bash

# Default is to use the latest build
VERSION="${1:-latest}"

echo "Starting deployment with version: $VERSION"

if [ -e .env ]; then
  echo "Loading environment variables from .env file"
  source .env
fi

echo "Stopping existing container..."
docker stop python-relay
echo "Removing existing container..."
docker remove python-relay

echo "Building new image..."
docker build . -t Eppo-exp/python-sdk-relay:$VERSION

echo "Starting new container..."
docker run -p $SDK_RELAY_PORT:$SDK_RELAY_PORT \
  --add-host host.docker.internal:host-gateway \
  -e SDK_REF \
  -e EPPO_BASE_URL \
  -e SDK_RELAY_PORT \
  --name python-relay \
  --rm \
  -t Eppo-exp/python-sdk-relay:$VERSION;