#!/usr/bin/env bash

# Set default values for vars
: "${SDK_REF:=main}"

SDK="https://github.com/Eppo-exp/eppo-multiplatform.git"

if [ -e .env ]; then
	source .env
fi

# Install dependencies
echo "Installing dependencies..."
dart pub get

# Create vendor directory for SDK checkout
mkdir -p vendor

# Clone or update the SDK repository
if [ -d "vendor/eppo-multiplatform" ]; then
    echo "Updating ${SDK}@${SDK_REF}"
    cd vendor/eppo-multiplatform
    git fetch
    git checkout ${SDK_REF}
    git pull
    cd ../..
else
    echo "Cloning ${SDK}@${SDK_REF}"
    git clone -b ${SDK_REF} --depth 1 --single-branch ${SDK} vendor/eppo-multiplatform || (
        echo "Cloning repo failed"
        exit 1
    )
fi

# Create .cargo directory and config.toml for patching crates
mkdir -p vendor/eppo-multiplatform/dart-sdk/rust/.cargo
cat > vendor/eppo-multiplatform/dart-sdk/rust/.cargo/config.toml << EOF
[patch.crates-io]
eppo_core = { path = '../../eppo_core' }
EOF

# Create native library directory
mkdir -p lib/native

# Build the native library
cd vendor/eppo-multiplatform/dart-sdk
cargo build --release
cd ../../..

# Copy the built library to the native directory
cp vendor/eppo-multiplatform/target/release/libeppo_client.dylib lib/native/

export DYLD_LIBRARY_PATH=./lib/native:$DYLD_LIBRARY_PATH

echo "Listening on ${SDK_RELAY_HOST}:${SDK_RELAY_PORT}"

# Run the server
dart --enable-experiment=native-assets run bin/server.dart
