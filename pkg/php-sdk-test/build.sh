#composer install


: "${SDK_REF:=main}"

# checkout the specified ref of the SDK repo, build it, and then insert it into vendors here.
mkdir -p tmp
git clone -b ${SDK_REF} --depth 1 --single-branch https://github.com/Eppo-exp/php-sdk.git tmp

# overwrite vendor files
cp -Rf tmp/. ./vendor/eppo/php-sdk/
rm -Rf tmp

. .env

# Run the poller
php src/eppo_poller.php &

php -S "${PHP_TEST_SERVER_HOST}:${PHP_TEST_SERVER_PORT}" src/index.php