# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

Cross-language test data for Eppo's feature flag SDKs. Contains UFC (Universal Flag Configuration) test cases that all SDK implementations (Node, Python, Ruby, Go, Java, .NET, PHP, Android, iOS, React Native) must pass. Also contains the package-testing infrastructure that runs published SDK packages against these test cases.

## Commands

```bash
yarn install                # install deps
yarn validate:tests         # validate UFC test cases (runs jest on ./test-validation)
yarn obfuscate:ufc          # regenerate ufc/flags-v1-obfuscated.json from ufc/flags-v1.json
```

Tests use Jest with ts-jest. Test files match `*.spec.ts`.

## Repository Structure

- `ufc/` - Universal Flag Configuration test data
  - `flags-v1.json` - source of truth flag definitions
  - `flags-v1-obfuscated.json` - generated obfuscated version (run `yarn obfuscate:ufc`)
  - `tests/` - assignment test cases (one JSON file per flag scenario)
  - `bandit-flags-v1.json`, `bandit-models-v1.json` - bandit-specific flag config
  - `bandit-tests/` - bandit test cases
- `test-validation/` - Jest specs that validate test case JSON consistency (assignment matches evaluationDetails)
- `obfuscation/` - obfuscation logic that hashes flag keys (MD5) and base64-encodes values
- `configuration-wire/` - precomputed configuration wire format with obfuscation generator (`npx ts-node generate.ts`)
- `assignment-v2/` - legacy assignment test cases
- `package-testing/` - integration test infrastructure for published SDK packages
  - `scenarios.json` - maps scenario names to UFC paths and test case directories
  - `sdk-test-runner/` - test runner that executes test cases against SDK relay servers
  - `testing-api/` - Express API for serving test data to SDK relays
  - `{language}-sdk-relay/` - per-language relay servers wrapping each SDK

## Test Case Format

Each JSON file in `ufc/tests/` follows `IAssignmentTestCase` (defined in `test-validation/types.ts`):

```
{ flag, variationType, defaultValue, subjects: [{ subjectKey, subjectAttributes, assignment, evaluationDetails }] }
```

Key invariant: when `evaluationDetails.flagEvaluationCode === "MATCH"`, `assignment` must equal `evaluationDetails.variationValue`. Otherwise, `assignment` must equal `defaultValue`.

## Flag Evaluation Concepts

Flags have variations and allocations. Allocations control traffic distribution via targeting rules evaluated against subject context. Splits within allocations distribute traffic across variants using a sharding system (subject key hashed, remainder mod max shard size determines shard assignment). Sharding layers (identified by salt) enable features like experimental layers for mutually exclusive traffic splits.

## CI

- `validate-test-data.yml` - runs on PRs touching `ufc/tests/**` and pushes to main
- `test-sdk-packages.yml` - runs published SDK packages against test data on push to main
- `test-sdks.yml` - triggers SDK test runs remotely
