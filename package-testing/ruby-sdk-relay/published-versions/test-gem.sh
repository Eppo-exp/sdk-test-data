#!/bin/bash

# Install the gem and verify it works
gem install eppo-server-sdk
ruby -r eppo_client -e 'puts "Installed version: #{EppoClient::VERSION}"' 
