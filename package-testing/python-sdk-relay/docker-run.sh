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
if docker run -p $SDK_RELAY_PORT:$SDK_RELAY_PORT \
  --add-host host.docker.internal:host-gateway \
  -e SDK_REF="$SDK_REF" \
  -e EPPO_BASE_URL="$EPPO_BASE_URL" \
  -e SDK_RELAY_PORT="$SDK_RELAY_PORT" \
  --name python-relay \
  -d --rm \
  -t Eppo-exp/python-sdk-relay:$VERSION; then
    echo "✅ Container started, checking status..."
    sleep 2  # Give the container a moment to start
    if docker ps | grep -q python-relay; then
        echo "✅ Container is running"
        docker logs python-relay
    else
        echo "❌ Container failed to stay running. Debug information:"
        echo "1. Checking logs:"
        docker logs python-relay 2>/dev/null || echo "No logs available"
        echo "2. Checking environment variables:"
        echo "SDK_REF=$SDK_REF"
        echo "EPPO_BASE_URL=$EPPO_BASE_URL"
        echo "SDK_RELAY_PORT=$SDK_RELAY_PORT"
        echo "3. Trying interactive run to see immediate output:"
        docker run --rm \
          -p $SDK_RELAY_PORT:$SDK_RELAY_PORT \
          --add-host host.docker.internal:host-gateway \
          -e SDK_REF="$SDK_REF" \
          -e EPPO_BASE_URL="$EPPO_BASE_URL" \
          -e SDK_RELAY_PORT="$SDK_RELAY_PORT" \
          Eppo-exp/python-sdk-relay:$VERSION
    fi
else
    echo "❌ Failed to start container"
fi
