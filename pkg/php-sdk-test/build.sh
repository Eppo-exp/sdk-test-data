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

echo "Listening on ${PHP_TEST_SERVER_HOST}:${PHP_TEST_SERVER_PORT}"

php -S "${PHP_TEST_SERVER_HOST}:${PHP_TEST_SERVER_PORT}" src/index.php