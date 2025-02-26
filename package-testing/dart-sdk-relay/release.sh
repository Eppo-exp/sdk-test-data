#!/usr/bin/env bash

docker build . -t Eppo-exp/dart-sdk-relay:latest
docker tag Eppo-exp/dart-sdk-relay:latest Eppo-exp/dart-sdk-relay:$1
