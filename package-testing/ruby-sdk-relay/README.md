## Ruby SDK Testing

This directory contains scripts for testing the Ruby SDK in various environments.

### Test Ruby Gems Installation

Verifies that the Ruby SDK can be installed from RubyGems in a variety of environments.

The `test-rubygems-install.sh` script builds Docker images for Alpine and Debian and runs the test script inside each container.

You should see output like the following if the tests pass:

```
Successfully installed eppo-server-sdk-3.3.0-aarch64-linux
1 gem installed
Installed version: 3.3.0
✅ Installation successful in debian environment
```
