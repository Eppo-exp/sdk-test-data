# Specify VERSION
VERSION=$1

if [[ -n "$VERSION" ]]; then
  echo "$VERSION" > ./VERSION
else
  VERSION=$(cat VERSION)
fi


docker build -t Eppo-exp/php-sdk-test:$VERSION .
docker tag Eppo-exp/php-sdk-test:$VERSION Eppo-exp/php-sdk-test:latest