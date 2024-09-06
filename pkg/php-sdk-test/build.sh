#!/usr/bin/env bash

composer install

: "${SDK_REF:=main}"
SDK="https://github.com/Eppo-exp/php-sdk.git"

# checkout the specified ref of the SDK repo, build it, and then insert it into vendors here.
mkdir -p tmp

echo "Cloning ${SDK}@${SDK_REF}"
git clone -b ${SDK_REF} --depth 1 --single-branch ${SDK} tmp

# overwrite vendor files
cp -Rf tmp/. ./vendor/eppo/php-sdk/
rm -Rf tmp

# Run the poller
php src/eppo_poller.php &

echo "Listening on ${SDK_RELAY_HOST}:${SDK_RELAY_PORT}"

php -S "${SDK_RELAY_HOST}:${SDK_RELAY_PORT}" -t src