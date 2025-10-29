# SDK test data

## Description

This is a set of test cases bundled as UFC - universal flag configuration. The purpose of these test cases is to ensure
SDK libraries are compliant with core application.

## Dependencies

Node.JS v18, Jest v29, Typescript v4

## Usage

1. install dependencies by runnning CLI command `yarn install`.
2. Update content of the [flags-v1.json](ufc/flags-v1.json).
3. Validate tests by runnning CLI command `yarn run validate:tests`. This validates both hand-crafted tests in `ufc/tests/` and generated tests in `ufc/generated-tests/`.
4. Obfuscate file [flags-v1.json](ufc/flags-v1.json) by runnning CLI command `yarn run obfuscate:ufc`. It will update
   file [flags-v1-obfuscated.json](ufc/flags-v1-obfuscated.json) with obfuscated version of the
   file [flags-v1.json](ufc/flags-v1.json).

## Flag Generator

The `generate-flags.ts` script can generate large numbers of test flags for scalability testing and comprehensive SDK validation.

### Usage

```bash
npx ts-node generate-flags.ts <number-of-flags> [output-path]
```

### Arguments

- `number-of-flags` - Number of flags to generate (required, max: 10,000)
- `output-path` - Output directory path (optional, default: "ufc")

### Examples

```bash
# Generate 2000 flags in ./ufc/ directory (default)
npx ts-node generate-flags.ts 2000

# Generate 100 flags in ./test-data/ directory
npx ts-node generate-flags.ts 100 test-data

# Generate 500 flags in ../output/ directory
npx ts-node generate-flags.ts 500 ../output
```

### Generated Flag Features

Each generated flag includes:

- **Multiple Variation Types**: STRING, INTEGER, BOOLEAN, NUMERIC, JSON
- **Smart Targeting Rules**: Geographic, demographic, and technical attribute targeting
- **Traffic Allocation**: Proper shard-based A/B testing setup
- **Complex Operators**: ONE_OF, MATCHES, LT/GT comparisons, IS_NULL checks
- **Realistic Test Data**: Appropriate values for each variation type and targeting scenario

The generated flags are designed to produce meaningful evaluations with various outcomes (MATCH, DEFAULT_ALLOCATION_NULL, TRAFFIC_EXPOSURE_MISS, FAILING_RULE) making them perfect for comprehensive SDK testing.

### Output Format

The generator creates a UFC-compliant JSON configuration file with the specified number of flags, following the same format as [flags-v1.json](ufc/flags-v1.json).

## Test Case Generator

The `generate-test-cases.ts` script generates test cases for flags that produce **actual evaluations** rather than just default values. This is crucial for effectively leveraging large flag configurations.

### Usage

```bash
npx ts-node generate-test-cases.ts <flags-file> [output-path]
```

### Arguments

- `flags-file` - Path to the flags JSON file (e.g., `ufc/flags-2000.json`)
- `output-path` - Output directory (optional, default: `ufc/generated-tests`)

### Examples

```bash
# Generate test cases for 2000 flags
npx ts-node generate-test-cases.ts ufc/flags-2000.json

# Generate with custom output directory
npx ts-node generate-test-cases.ts ufc/flags-1000.json custom-tests/
```

### Smart Subject Generation

The key innovation is **rule-aware subject generation**. Instead of random subjects that mostly get default values, it analyzes each flag's rules and generates subjects that will:

- **Match allocation rules** → `flagEvaluationCode: "MATCH"`
- **Fail allocation rules** → `flagEvaluationCode: "FAILING_RULE"`
- **Miss traffic allocation** → `flagEvaluationCode: "TRAFFIC_EXPOSURE_MISS"`

### Test Organization

Generated tests are organized by flag characteristics:

- `test-generated-geographic-*.json` - Country/region targeting flags
- `test-generated-demographic-*.json` - Age/plan/subscription targeting
- `test-generated-technical-*.json` - Browser/OS/device targeting
- `test-generated-email_matching-*.json` - Email regex pattern matching
- `test-generated-numeric_comparisons-*.json` - LT/GT/GTE comparison operators
- `test-generated-complex_rules-*.json` - Multi-condition AND logic

### Output Format

Each generated test file follows the existing `IAssignmentTestCase` format:

```json
{
  "flag": "test-flag-0001",
  "variationType": "STRING",
  "defaultValue": "default",
  "subjects": [
    {
      "subjectKey": "match-allocation-1-rule-0",
      "subjectAttributes": {
        "country": "Canada",
        "subscription": "subscription-matching-value"
      },
      "assignment": "test-flag-0001-control-value",
      "evaluationDetails": {
        "flagEvaluationCode": "MATCH",
        "variationValue": "test-flag-0001-control-value",
        "matchedRule": { "conditions": [...] }
      }
    }
  ]
}
```

This ensures compatibility with existing test runners and validation frameworks.

# SDK Package Testing

[![Test Packaged SDKs](https://github.com/Eppo-exp/sdk-test-data/actions/workflows/test-sdk-packages.yml/badge.svg)](https://github.com/Eppo-exp/sdk-test-data/actions/workflows/test-sdk-packages.yml)  
[![Test SDKs Remotely](https://github.com/Eppo-exp/sdk-test-data/actions/workflows/test-sdks-remote.yml/badge.svg)](https://github.com/Eppo-exp/sdk-test-data/actions/workflows/test-sdks-remote.yml)

| SDK                                                                                     | Published Version                                                                                                                                                                                       | Test Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [JS Common Client](https://github.com/Eppo-exp/js-sdk-common)                           | [![](https://img.shields.io/npm/v/@eppo/js-client-sdk-common)](https://www.npmjs.com/package/@eppo/js-client-sdk-common)                                                                                | [![Test and lint SDK](https://github.com/Eppo-exp/js-sdk-common/actions/workflows/lint-test-sdk.yml/badge.svg)](https://github.com/Eppo-exp/js-sdk-common/actions/workflows/lint-test-sdk.yml)                                                                                                                                                                                                                                                                                                                                                  |
| [JS Client](https://github.com/Eppo-exp/js-client-sdk)                                  | [![](https://img.shields.io/npm/v/@eppo/js-client-sdk)](https://www.npmjs.com/package/@eppo/js-client-sdk)                                                                                              | [![Test and lint SDK](https://github.com/Eppo-exp/js-client-sdk/actions/workflows/lint-test-sdk.yml/badge.svg)](https://github.com/Eppo-exp/js-client-sdk/actions/workflows/lint-test-sdk.yml)                                                                                                                                                                                                                                                                                                                                                  | |
| [React Native](https://github.com/Eppo-exp/react-native-sdk)                            | [![](https://img.shields.io/npm/v/@eppo/react-native-sdk)](https://www.npmjs.com/package/@eppo/react-native-sdk)                                                                                        | [![Test and lint SDK](https://github.com/Eppo-exp/react-native-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/Eppo-exp/react-native-sdk/actions/workflows/ci.yml)                                                                                                                                                                                                                                                                                                                                                                  | |
| [Node Server](https://github.com/Eppo-exp/node-server-sdk)                              | [![](https://img.shields.io/npm/v/@eppo/node-server-sdk)](https://www.npmjs.com/package/@eppo/node-server-sdk)                                                                                          | [![Test and lint SDK](https://github.com/Eppo-exp/node-server-sdk/actions/workflows/lint-test-sdk.yml/badge.svg)](https://github.com/Eppo-exp/node-server-sdk/actions/workflows/lint-test-sdk.yml)                                                                                                                                                                                                                                                                                                                                              | |
| [Java Common](https://github.com/Eppo-exp/sdk-common-jdk)                               | [![Maven Central](https://maven-badges.herokuapp.com/maven-central/cloud.eppo/sdk-common-jvm/badge.svg)](https://maven-badges.herokuapp.com/maven-central/cloud.eppo/sdk-common-jvm)                    | [![Test and lint](https://github.com/Eppo-exp/sdk-common-jdk/actions/workflows/lint-test-sdk.yml/badge.svg)](https://github.com/Eppo-exp/sdk-common-jdk/actions/workflows/lint-test-sdk.yml)                                                                                                                                                                                                                                                                                                                                                    | |
| [Java Server](https://github.com/Eppo-exp/java-server-sdk)                              | [![Maven Central](https://maven-badges.herokuapp.com/maven-central/cloud.eppo/eppo-server-sdk/badge.svg)](https://maven-badges.herokuapp.com/maven-central/cloud.eppo/eppo-server-sdk)                  | [![Test and lint SDK](https://github.com/Eppo-exp/java-server-sdk/actions/workflows/lint-test-sdk.yml/badge.svg)](https://github.com/Eppo-exp/java-server-sdk/actions/workflows/lint-test-sdk.yml)                                                                                                                                                                                                                                                                                                                                              | |
| [Android](https://github.com/Eppo-exp/android-sdk)                                      | [![Maven Central](https://maven-badges.herokuapp.com/maven-central/cloud.eppo/android-sdk/badge.svg)](https://maven-badges.herokuapp.com/maven-central/cloud.eppo/android-sdk)                          | [![Test](https://github.com/Eppo-exp/android-sdk/actions/workflows/test.yaml/badge.svg)](https://github.com/Eppo-exp/android-sdk/actions/workflows/test.yaml)                                                                                                                                                                                                                                                                                                                                                                                   | |
| [iOS](https://github.com/Eppo-exp/eppo-ios-sdk)                                         | [![GitHub release (latest by date)](https://img.shields.io/github/v/release/Eppo-exp/eppo-ios-sdk)](https://github.com/Eppo-exp/eppo-ios-sdk/releases)                                                  | [![Test and lint SDK](https://github.com/Eppo-exp/eppo-ios-sdk/actions/workflows/unit-tests.yml/badge.svg)](https://github.com/Eppo-exp/eppo-ios-sdk/actions/workflows/unit-tests.yml)                                                                                                                                                                                                                                                                                                                                                          | |
| [PHP](https://github.com/Eppo-exp/php-sdk)                                              | [![Packagist Version](https://img.shields.io/packagist/v/eppo/php-sdk)](https://packagist.org/packages/eppo/php-sdk)                                                                                    | [![Run Tests](https://github.com/Eppo-exp/php-sdk/actions/workflows/run-tests.yml/badge.svg)](https://github.com/Eppo-exp/php-sdk/actions/workflows/run-tests.yml)                                                                                                                                                                                                                                                                                                                                                                              | |
| [Golang](https://github.com/Eppo-exp/golang-sdk)                                        | [![Go Module Version](https://img.shields.io/github/v/tag/Eppo-exp/golang-sdk?label=go%20module)](https://github.com/Eppo-exp/golang-sdk/tags)                                                          | [![Test SDK](https://github.com/Eppo-exp/golang-sdk/actions/workflows/test.yml/badge.svg)](https://github.com/Eppo-exp/golang-sdk/actions/workflows/test.yml)                                                                                                                                                                                                                                                                                                                                                                                   | |
| [.NET](https://github.com/Eppo-exp/dot-net-server-sdk)                                  | [![NuGet](https://img.shields.io/nuget/v/Eppo.Sdk)](https://www.nuget.org/packages/Eppo.Sdk)                                                                                                            | [![Run Tests](https://github.com/Eppo-exp/dot-net-server-sdk/actions/workflows/run-tests.yml/badge.svg)](https://github.com/Eppo-exp/dot-net-server-sdk/actions/workflows/run-tests.yml)                                                                                                                                                                                                                                                                                                                                                        | |
| [Multiplatform](https://github.com/Eppo-exp/eppo-multiplatform):<br> Rust, Ruby, Python | [![PyPI](https://img.shields.io/pypi/v/eppo-server-sdk)](https://pypi.org/project/eppo-server-sdk)<br>[![Gem](https://img.shields.io/gem/v/eppo-server-sdk)](https://rubygems.org/gems/eppo-server-sdk) | [![Test](https://github.com/Eppo-exp/eppo-multiplatform/actions/workflows/ci.yml/badge.svg)](https://github.com/Eppo-exp/eppo-multiplatform/actions/workflows/ci.yml) <br> [![Python SDK](https://github.com/Eppo-exp/eppo-multiplatform/actions/workflows/python.yml/badge.svg)](https://github.com/Eppo-exp/eppo-multiplatform/actions/workflows/python.yml)<br>[![Ruby SDK](https://github.com/Eppo-exp/eppo-multiplatform/actions/workflows/ruby.yml/badge.svg)](https://github.com/Eppo-exp/eppo-multiplatform/actions/workflows/ruby.yml) |

