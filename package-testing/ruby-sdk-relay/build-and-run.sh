#!/usr/bin/env bash

# Set default values for vars
: "${SDK_REF:=main}"
: "${SDK_RELAY_HOST:=localhost}"
: "${SDK_RELAY_PORT:=4000}"
SDK="https://github.com/Eppo-exp/eppo-multiplatform.git"

# Check if Ruby is installed
if ! command -v ruby &> /dev/null; then
    echo "Ruby is not installed. Please install Ruby before running this script."
    echo "You can install Ruby using your package manager or a version manager like rbenv or rvm."
    exit 1
fi

# Check if Bundler is installed, install if not
if ! command -v bundle &> /dev/null; then
    echo "Bundler is not installed. Installing Bundler..."
    gem install bundler || { echo "Failed to install Bundler"; exit 1; }
fi

# Install Ruby dependencies
echo "Installing Ruby dependencies..."
bundle install || { echo "Failed to install Ruby dependencies"; exit 1; }

# checkout the specified ref of the SDK repo, build it, and then insert it into vendors here.
rm -rf tmp
mkdir -p tmp

echo "Cloning ${SDK}@${SDK_REF}"
git clone -b ${SDK_REF} --depth 1 --single-branch ${SDK} tmp || { echo "Cloning repo failed"; exit 1; }

# Build and install the Ruby gem with Rust components
echo "Building and installing the Ruby SDK with Rust components..."
if [ -d "tmp/ruby-sdk" ]; then
  cd tmp/ruby-sdk
  
  # Install dependencies
  bundle install || { echo "Failed to install Ruby SDK dependencies"; exit 1; }
  
  # Build the gem with Rust components
  bundle exec rake build || { echo "Failed to build the Ruby gem"; exit 1; }
  
  # Install the built gem
  GEM_FILE=$(ls pkg/*.gem 2>/dev/null | head -n 1)
  if [ -n "$GEM_FILE" ]; then
    gem install $GEM_FILE || { echo "Failed to install the gem"; exit 1; }
  else
    echo "Error: Gem file not found"
    exit 1
  fi
  cd ../..
else
  echo "Error: Ruby SDK directory not found at expected location (tmp/ruby-sdk)"
  exit 1
fi

# cleanup
rm -rf tmp

# start the relay server
echo "Listening on ${SDK_RELAY_HOST}:${SDK_RELAY_PORT}"
SDK_RELAY_HOST=${SDK_RELAY_HOST} SDK_RELAY_PORT=${SDK_RELAY_PORT} bundle exec ruby src/server.rb
