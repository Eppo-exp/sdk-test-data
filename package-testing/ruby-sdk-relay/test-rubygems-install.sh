#!/bin/bash

# Default environment if none specified
ENV=${1:-"all"}

# Constants
DOCKERFILE_FORMAT="Dockerfile.rubygems"
DOCKER_TAG_PREFIX="rubygems-test"
TEST_DIRECTORY="published-versions"

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Ensure test script exists
if [ ! -f "$TEST_DIRECTORY/test-gem.sh" ]; then
    echo "Error: $TEST_DIRECTORY/test-gem.sh not found"
    exit 1
fi

# Function to test in specific environment
test_environment() {
    local env=$1
    echo "Testing installation in $env environment..."
    
    # Build from the published-versions directory where both Dockerfile and test-gem.sh are located
    docker build -t "$DOCKER_TAG_PREFIX-$env" -f "$TEST_DIRECTORY/$DOCKERFILE_FORMAT.$env" "$TEST_DIRECTORY"
    docker run --rm "$DOCKER_TAG_PREFIX-$env"
    
    local result=$?
    if [ $result -eq 0 ]; then
        echo "✅ Installation successful in $env environment"
    else
        echo "❌ Installation failed in $env environment"
    fi
    return $result
}

# Run tests based on environment parameter
case $ENV in
    "alpine")
        test_environment "alpine"
        ;;
    "debian")
        test_environment "debian"
        ;;
    "all")
        failed=0
        test_environment "alpine" || failed=1
        test_environment "debian" || failed=1
        exit $failed
        ;;
    *)
        echo "Unsupported environment: $ENV"
        echo "Supported environments: alpine, debian, all"
        exit 1
        ;;
esac
