VERSION=$1

docker build . -t Eppo-exp/test-api-server:$VERSION
docker tag Eppo-exp/test-api-server:$VERSION Eppo-exp/test-api-server:latest
