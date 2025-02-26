#!/usr/bin/env bash

# Set default values for vars
: "${SDK_REF:=main}"

SDK="https://github.com/Eppo-exp/eppo-multiplatform.git"

if [ -e .env ]; then
	source .env
fi

# Install dependencies
echo "Installing dependencies..."
dart pub get

# Create tmp directory for SDK checkout
mkdir -p tmp

echo "Cloning ${SDK}@${SDK_REF}"
git clone -b ${SDK_REF} --depth 1 --single-branch ${SDK} tmp || (
	echo "Cloning repo failed"
	exit 1
)

# TODO: This is where you'll add the build steps for the Dart SDK
# For example:
# cd tmp/dart
# dart pub get
# dart compile exe -o eppo_dart_sdk.dart
# cp -R build/. ../lib/eppo_dart_sdk/

# Clean up
rm -rf tmp

echo "Listening on ${SDK_RELAY_HOST}:${SDK_RELAY_PORT}"

# Run the server
dart run bin/server.dart
