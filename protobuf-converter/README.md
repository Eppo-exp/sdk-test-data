# UFC Protobuf Converter

This tool converts JSON UFC (Universal Flag Configuration) files to binary protobuf format for validation testing and SDK integration.

## Purpose

- **Validation Testing**: Compare JSON vs protobuf serialization for consistency
- **SDK Testing**: Generate protobuf test fixtures for client SDK validation
- **Performance Analysis**: Measure compression ratios and parsing performance
- **Integration Testing**: Test protobuf endpoint against known good data

## Installation

Dependencies are already included in the parent `package.json`. Run:

```bash
cd ~/eppo/sdk-test-data
yarn install
```

## Usage

### Convert All UFC Files

```bash
yarn convert:protobuf
```

This automatically:
- Scans the `ufc/` directory for JSON files
- Validates each file has proper UFC structure
- Converts valid UFC files to `.pb` format
- Skips non-UFC files (like bandit models)
- Reports compression ratios

### Convert Specific File

```bash
# Convert with auto-generated output name
yarn convert:protobuf ufc/flags-v1.json

# Convert with custom output name
yarn convert:protobuf ufc/flags-v1.json my-test-data.pb
```

### Help

```bash
yarn convert:protobuf --help
```

### Validate Generated Files

```bash
yarn validate:protobuf
```

This tool:
- Reads all `.pb` files in the `ufc/` directory
- Deserializes each protobuf binary back to JavaScript objects
- Validates basic structure and data integrity
- Reports detailed information about each file

## Output

The converter creates binary protobuf files alongside the JSON sources:

```
ufc/
├── flags-v1.json          # Original JSON UFC
├── flags-v1.pb            # Generated protobuf binary
├── bandit-flags-v1.json   # Original JSON UFC
├── bandit-flags-v1.pb     # Generated protobuf binary
└── bandit-models-v1.json  # Skipped (not UFC format)
```

## Performance Results

Typical compression ratios:
- **Regular UFC**: ~76% compression (85KB → 20KB)
- **Bandit UFC**: ~82% compression (11KB → 2KB)

## File Structure

```
protobuf-converter/
├── README.md                              # This file
├── convert.ts                             # Main conversion CLI
├── validate.ts                            # Validation tool
├── dto/                                   # TypeScript DTOs
│   ├── ufc.dto.ts                        # UFC data structures
│   ├── ufc-format.enum.ts                # Format enum
│   ├── experiment-variation-*.enum.ts    # Variation enums
│   └── targeting-rule-condition.ts       # Targeting interfaces
├── generated/                             # Generated protobuf files
│   ├── ufc_pb.d.ts                       # TypeScript definitions
│   └── ufc_pb.js                         # JavaScript implementation
└── helpers/
    └── protobuf-serialization.helper.ts  # Conversion logic
```

## Validation

The converter validates that JSON files contain proper UFC structure:
- ✅ `createdAt` (string)
- ✅ `format` (SERVER|CLIENT)
- ✅ `environment.name` (string)
- ✅ `flags` (object)

Non-UFC JSON files are automatically skipped during bulk conversion.

## SDK Integration

Generated `.pb` files can be used to test SDK protobuf deserialization:

**Swift:**
```swift
let data = try Data(contentsOf: URL(fileURLWithPath: "flags-v1.pb"))
let ufc = try Ufc_UniversalFlagConfig(serializedData: data)
```

**TypeScript/JavaScript:**
```typescript
const fs = require('fs');
const { UniversalFlagConfig } = require('./generated/ufc_pb');

const buffer = fs.readFileSync('flags-v1.pb');
const ufc = UniversalFlagConfig.deserializeBinary(buffer);
```

## Generated Files

The protobuf converter includes:
- **Internal protobuf bindings** - Generated from API service protobuf schema
- **Clean DTOs** - Stripped of NestJS/GraphQL dependencies
- **Validation logic** - Ensures proper UFC structure
- **CLI interface** - Easy bulk and single file conversion

This enables comprehensive testing of protobuf serialization/deserialization across different platforms and languages.