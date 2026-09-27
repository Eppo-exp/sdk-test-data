#!/usr/bin/env bash
set -e

composer install

# Set default values for vars

: "${SDK_REF:=main}"
: "${SDK_RELAY_HOST:=localhost}"
: "${SDK_RELAY_PORT:=4000}"
SDK="https://github.com/Eppo-exp/php-sdk.git"


# checkout the specified ref of the SDK repo, build it, and then insert it into vendors here.
# SDK_REF: branch, tag, full commit SHA, refs/..., or <N>/merge (a pull_request ref_name).
ref="${SDK_REF}"
if [[ "$ref" =~ ^[0-9]+/(merge|head)$ ]]; then
  ref="refs/pull/${ref}"
fi

echo "Cloning ${SDK}@${ref}"
rm -Rf tmp
git init -q tmp
git -C tmp fetch -q --depth 1 -- "${SDK}" "${ref}" || { echo "Cloning repo failed"; exit 1; }
git -C tmp checkout -q FETCH_HEAD
echo "Checked out $(git -C tmp rev-parse HEAD)"

# overwrite vendor files
cp -Rf tmp/. ./vendor/eppo/php-sdk/
rm -Rf tmp

# Run the poller
php src/eppo_poller.php &

echo "Listening on port ${SDK_RELAY_PORT}"

php -S "0.0.0.0:${SDK_RELAY_PORT}" -t src
