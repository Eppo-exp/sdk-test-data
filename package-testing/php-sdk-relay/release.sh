# Specify VERSION
VERSION=$1

docker build -t Eppo-exp/php-sdk-relay:$VERSION .
docker tag Eppo-exp/php-sdk-relay:$VERSION Eppo-exp/php-sdk-relay:latest