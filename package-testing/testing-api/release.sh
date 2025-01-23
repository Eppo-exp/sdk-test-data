# Please ensure the vesrion in package.json matches what is passed to this script.
# TODO automate version setting/getting

VERSION=$1

docker build . -t Eppo-exp/testing-api:$VERSION
docker tag Eppo-exp/testing-api:$VERSION Eppo-exp/testing-api:latest
