TEST_DATA_REF=${1:-main}

mkdir -p test-data
cd test-data
git clone -b $TEST_DATA_REF --depth 1 --single-branch https://github.com/Eppo-exp/sdk-test-data.git tmp

# copy test files (config and test cases)
cp -R tmp/ufc ./

# copy the scenarios file.
cp tmp/package-testing/scenarios.json ./

rm -Rf tmp
