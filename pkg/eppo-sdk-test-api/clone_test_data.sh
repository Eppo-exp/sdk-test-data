mkdir -p test-data
cd test-data
git clone -b main --depth 1 --single-branch https://github.com/Eppo-exp/sdk-test-data.git tmp
cp -R tmp/ufc ./
rm -Rf tmp