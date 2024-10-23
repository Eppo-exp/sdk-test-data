# Please ensure the vesrion in package.json matches what is passed to this script.
# usage: ./release.sh <version>
VERSION=$1

docker build . -t Eppo-exp/sdk-test-runner:$VERSION
docker tag Eppo-exp/sdk-test-runner:$VERSION Eppo-exp/sdk-test-runner:latest

# TODO push to github artifact registry.
