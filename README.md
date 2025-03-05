# SDK test data
## Description
This is a set of test cases bundled as UFC - universal flag configuration. The purpose of these test cases is to ensure SDK libraries are compliant with core application.

## Dependencies
Node.JS v18, Jest v29, Typescript v4

## Usage
1. install dependencies by runnning CLI command `yarn install`.
2. Update content of the [flags-v1.json](ufc/flags-v1.json).
3. Validate tests by runnning CLI command `yarn run validate:tests`. 
4. Obfuscate file [flags-v1.json](ufc/flags-v1.json) by runnning CLI command `yarn run obfuscate:ufc`. It will update file [flags-v1-obfuscated.json](ufc/flags-v1-obfuscated.json) with obfuscated version of the file [flags-v1.json](ufc/flags-v1.json).
