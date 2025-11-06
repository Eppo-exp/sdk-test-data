#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { UniversalFlagConfig } from './generated/ufc_pb';

/**
 * Protobuf Validation Tool
 *
 * Validates that generated .pb files can be properly deserialized
 * and verifies basic structure integrity.
 */

function validateProtobufFile(filePath: string): boolean {
  try {
    console.log(`\n🔍 Validating ${filePath}...`);

    // Read binary file
    const buffer = fs.readFileSync(filePath);

    // Deserialize protobuf
    const ufc = UniversalFlagConfig.deserializeBinary(new Uint8Array(buffer));

    // Basic validation
    const createdAt = ufc.getCreatedAt();
    const format = ufc.getFormat();
    const environment = ufc.getEnvironment();
    const flagsMap = ufc.getFlagsMap();

    console.log(`   ✅ Created at: ${createdAt}`);
    console.log(`   ✅ Format: ${format}`);
    console.log(`   ✅ Environment: ${environment?.getName()}`);
    console.log(`   ✅ Flags count: ${flagsMap.getLength()}`);

    // Validate each flag
    let flagCount = 0;
    flagsMap.forEach((flag, flagKey) => {
      flagCount++;
      const variationsMap = flag.getVariationsMap();
      const allocationsList = flag.getAllocationsList();

      console.log(`     • Flag "${flagKey}": enabled=${flag.getEnabled()}, variations=${variationsMap.getLength()}, allocations=${allocationsList.length}`);
    });

    // Check bandit references
    const banditReferencesMap = ufc.getBanditReferencesMap();
    if (banditReferencesMap.getLength() > 0) {
      console.log(`   ✅ Bandit references: ${banditReferencesMap.getLength()}`);
    }

    console.log(`   🎉 Validation successful - all data properly deserialized`);
    return true;

  } catch (error) {
    console.error(`   ❌ Validation failed:`, error instanceof Error ? error.message : error);
    return false;
  }
}

function main() {
  console.log('🧪 UFC Protobuf Validation Tool\n');

  const ufcDir = './ufc';
  const pbFiles = fs.readdirSync(ufcDir)
    .filter(file => file.endsWith('.pb'))
    .map(file => path.join(ufcDir, file));

  if (pbFiles.length === 0) {
    console.log('No .pb files found in ufc/ directory');
    console.log('Run "yarn convert:protobuf" first to generate protobuf files');
    return;
  }

  console.log(`Found ${pbFiles.length} protobuf files to validate:`);

  let successCount = 0;
  for (const pbFile of pbFiles) {
    if (validateProtobufFile(pbFile)) {
      successCount++;
    }
  }

  console.log(`\n📊 Validation Summary: ${successCount}/${pbFiles.length} files passed validation`);

  if (successCount === pbFiles.length) {
    console.log('🎉 All protobuf files validated successfully!');
    process.exit(0);
  } else {
    console.log('❌ Some files failed validation');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}