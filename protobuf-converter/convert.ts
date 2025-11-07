#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { UniversalFlagConfig } from './dto/ufc.dto';
import { ProtobufSerializationHelper } from './helpers/protobuf-serialization.helper';

/**
 * UFC JSON to Protobuf Converter
 *
 * Converts JSON UFC (Universal Flag Configuration) files to protobuf binary format
 * for validation testing and SDK integration.
 *
 * Usage:
 *   yarn convert:protobuf [input-file] [output-file]
 *   yarn convert:protobuf                                    # Convert all UFC JSON files
 *   yarn convert:protobuf ufc/flags-v1.json                 # Convert specific file
 *   yarn convert:protobuf ufc/flags-v1.json output.pb       # Convert with custom output
 */

function printUsage() {
  console.log(`
UFC JSON to Protobuf Converter

Usage:
  yarn convert:protobuf [input-file] [output-file]

Examples:
  yarn convert:protobuf                                    # Convert all UFC JSON files in ufc/ directory
  yarn convert:protobuf ufc/flags-v1.json                 # Convert specific file to flags-v1.pb
  yarn convert:protobuf ufc/flags-v1.json output.pb       # Convert with custom output name

Options:
  --help, -h                                              # Show this help message
`);
}

function isValidUfcFile(data: any): data is UniversalFlagConfig {
  return (
    data &&
    typeof data.createdAt === 'string' &&
    data.format &&
    data.environment &&
    typeof data.environment.name === 'string' &&
    data.flags &&
    typeof data.flags === 'object'
  );
}

function convertUfcJsonToProtobuf(inputPath: string, outputPath: string, skipInvalid: boolean = false): boolean {
  try {
    console.log(`Converting ${inputPath} -> ${outputPath}`);

    // Read and parse JSON file
    const jsonContent = fs.readFileSync(inputPath, 'utf-8');
    const parsedData = JSON.parse(jsonContent);

    // Validate UFC structure
    if (!isValidUfcFile(parsedData)) {
      if (skipInvalid) {
        console.log(`⏭️  Skipping ${inputPath} - not a valid UFC file`);
        return false;
      } else {
        throw new Error('Invalid UFC structure: missing required fields (createdAt, format, environment, flags)');
      }
    }

    const ufcData: UniversalFlagConfig = parsedData;

    // Convert to protobuf binary
    const protobufBinary = ProtobufSerializationHelper.serialize(ufcData);

    // Write binary file
    fs.writeFileSync(outputPath, Buffer.from(protobufBinary));

    console.log(`✅ Successfully converted ${inputPath} to protobuf binary`);
    console.log(`   JSON size: ${jsonContent.length} bytes`);
    console.log(`   Protobuf size: ${protobufBinary.length} bytes`);
    console.log(`   Compression: ${((1 - protobufBinary.length / jsonContent.length) * 100).toFixed(1)}%`);

    return true;

  } catch (error) {
    console.error(`❌ Error converting ${inputPath}:`, error instanceof Error ? error.message : error);
    if (!skipInvalid) {
      process.exit(1);
    }
    return false;
  }
}

function findUfcJsonFiles(directory: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(directory)) {
    return files;
  }

  const items = fs.readdirSync(directory);

  for (const item of items) {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && item.endsWith('.json') && !item.includes('obfuscated')) {
      // Skip obfuscated files as they may have different structure
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  if (args.length === 0) {
    // Convert all UFC JSON files
    console.log('🔍 Looking for UFC JSON files...');

    const ufcFiles = findUfcJsonFiles('./ufc');

    if (ufcFiles.length === 0) {
      console.log('No UFC JSON files found in ./ufc directory');
      return;
    }

    console.log(`Found ${ufcFiles.length} JSON files`);

    let convertedCount = 0;
    for (const inputFile of ufcFiles) {
      const basename = path.basename(inputFile, '.json');
      const outputFile = path.join('./ufc', `${basename}.pb`);
      if (convertUfcJsonToProtobuf(inputFile, outputFile, true)) {
        convertedCount++;
      }
    }

    console.log(`\n📊 Summary: ${convertedCount}/${ufcFiles.length} files converted to protobuf`);

  } else if (args.length === 1) {
    // Convert specific file with auto-generated output name
    const inputFile = args[0];
    const basename = path.basename(inputFile, '.json');
    const directory = path.dirname(inputFile);
    const outputFile = path.join(directory, `${basename}.pb`);

    convertUfcJsonToProtobuf(inputFile, outputFile);

  } else if (args.length === 2) {
    // Convert specific file with custom output name
    const inputFile = args[0];
    const outputFile = args[1];

    convertUfcJsonToProtobuf(inputFile, outputFile);

  } else {
    console.error('❌ Too many arguments provided');
    printUsage();
    process.exit(1);
  }

  console.log('🎉 Conversion completed successfully!');
}

if (require.main === module) {
  main();
}