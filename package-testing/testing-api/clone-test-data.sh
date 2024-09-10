TEST_DATA_REF=${TEST_DATA_REF:-main}
mkdir -p test-data
cd test-data
git clone -b $TEST_DATA_REF --depth 1 --single-branch https://github.com/Eppo-exp/sdk-test-data.git tmp
cp -R tmp/ufc ./

rm -Rf tmp

cp ../../scenarios.json ./ # TODO copy from the repository instead of locally.