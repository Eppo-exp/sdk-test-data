# Please ensure the vesrion in package.json matches what is passed to this script.
# TODO automate version setting/getting

VERSION=$1

docker build . -t Eppo-exp/test-api-server:$VERSION
docker tag Eppo-exp/test-api-server:$VERSION Eppo-exp/test-api-server:latest

# TODO push to github artifact registry.
