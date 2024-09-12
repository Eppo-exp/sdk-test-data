# Specify VERSION
VERSION=$1

if [[ -n "$VERSION" ]]; then
  echo "$VERSION" > ./VERSION
else
  VERSION=$(cat VERSION)
fi


docker build -t Eppo-exp/php-sdk-relay:$VERSION .
docker tag Eppo-exp/php-sdk-relay:$VERSION Eppo-exp/php-sdk-relay:latest
