#Copy the test data from the local fs
mkdir -p test-data
cd test-data
cp -R ../../../ufc ./
cp ../../scenarios.json ./

cp ../scenarios.json ./ # TODO remove this when scenarios.json is commonly accessible