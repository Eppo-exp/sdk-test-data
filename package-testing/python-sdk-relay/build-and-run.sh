#!/usr/bin/env bash

# Set default values for vars

: "${SDK_REF:=main}"
: "${SDK_RELAY_HOST:=localhost}"
: "${SDK_RELAY_PORT:=4000}"
SDK="https://github.com/Eppo-exp/eppo-multiplatform.git"

# checkout the specified ref of the SDK repo, build it, and then insert it into vendors here.
rm -rf tmp
mkdir -p tmp

echo "Cloning ${SDK}@${SDK_REF}"
git clone -b ${SDK_REF} --depth 1 --single-branch ${SDK} tmp || ( echo "Cloning repo failed"; exit 1 )

# Run the poller
python3 -m venv tmp/.venv
source tmp/.venv/bin/activate
pip install maturin

pip install -r requirements.txt

# Build the wheel file in tmp directory
maturin build --release --out tmp/dist --find-interpreter --manifest-path ./tmp/python-sdk/Cargo.toml

# Get Python version and find matching wheel
PYTHON_VERSION=$(python3 -c 'import sys; print(f"cp{sys.version_info.major}{sys.version_info.minor}")')
echo "Looking for wheel for Python version: ${PYTHON_VERSION}"

WHEEL_FILE=$(find tmp/dist -name "eppo_server_sdk-*-${PYTHON_VERSION}-*.whl" | head -n 1)
echo "Found wheel file: ${WHEEL_FILE}"

if [ -z "$WHEEL_FILE" ]; then
    echo "Error: Wheel file not found for Python version ${PYTHON_VERSION}"
    echo "Available wheels:"
    ls tmp/dist
    exit 1
fi

pip install "${WHEEL_FILE}"

echo "Listening on port ${SDK_RELAY_HOST}:${SDK_RELAY_PORT}"

python3 src/server.py
