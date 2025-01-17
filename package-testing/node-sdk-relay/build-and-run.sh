#!/usr/bin/env bash

composer install

# Set default values for vars

: "${SDK_REF:=main}"
: "${SDK_RELAY_HOST:=localhost}"
: "${SDK_RELAY_PORT:=4000}"
SDK="https://github.com/Eppo-exp/node-server-sdk.git"


# checkout the specified ref of the SDK repo, build it, and then insert it into vendors here.
mkdir -p tmp

echo "Cloning ${SDK}@${SDK_REF}"
git clone -b ${SDK_REF} --depth 1 --single-branch ${SDK} tmp || ( echo "Cloning repo failed"; exit 1 )

# overwrite vendor files
cp -Rf tmp/. ./vendor/eppo/node-server-sdk/
rm -Rf tmp

# Run the poller
yarn install
echo "Listening on port ${SDK_RELAY_PORT}"
yarn start
