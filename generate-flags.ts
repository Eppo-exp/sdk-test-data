#!/usr/bin/env npx ts-node

import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';

// Types for flag configuration
interface Variation {
  key: string;
  value: string | number | boolean;
}

interface ShardRange {
  start: number;
  end: number;
}

interface Shard {
  salt: string;
  ranges: ShardRange[];
}

interface Condition {
  attribute: string;
  operator: string;
  value: string | number | boolean | string[];
}

interface Rule {
  conditions: Condition[];
}

interface Split {
  variationKey: string;
  shards: Shard[];
  extraLogging?: Record<string, string>;
}

interface Allocation {
  key: string;
  rules: Rule[];
  splits: Split[];
  doLog: boolean;
  startAt?: string;
  endAt?: string;
}

interface Flag {
  key: string;
  enabled: boolean;
  variationType: string;
  variations: Record<string, Variation>;
  allocations: Allocation[];
  totalShards: number;
  comment?: string;
}

interface Environment {
  name: string;
}

interface Configuration {
  createdAt: string;
  format: string;
  environment: Environment;
  flags: Record<string, Flag>;
}

// Configuration constants
const TOTAL_SHARDS = 10000;

// Variation types
const VARIATION_TYPES = ['STRING', 'INTEGER', 'BOOLEAN', 'NUMERIC', 'JSON'] as const;
type VariationType = typeof VARIATION_TYPES[number];

// Operators for rules
const OPERATORS = [
  'ONE_OF', 'NOT_ONE_OF', 'MATCHES', 'NOT_MATCHES',
  'LT', 'LTE', 'GT', 'GTE', 'IS_NULL'
] as const;
type Operator = typeof OPERATORS[number];

// Common attributes for targeting
const ATTRIBUTES = [
  'country', 'email', 'age', 'size', 'version', 'id', 'plan',
  'region', 'device', 'platform', 'userId', 'companyId',
  'accountType', 'subscription', 'browser', 'os', 'language'
] as const;

// Sample values for different attributes
const ATTRIBUTE_VALUES: Record<string, string[]> = {
  country: ['US', 'Canada', 'Mexico', 'UK', 'Germany', 'France', 'Japan', 'Australia'],
  region: ['North America', 'Europe', 'Asia', 'South America', 'Africa'],
  plan: ['free', 'basic', 'premium', 'enterprise'],
  accountType: ['individual', 'business', 'nonprofit'],
  subscription: ['trial', 'monthly', 'yearly'],
  browser: ['chrome', 'firefox', 'safari', 'edge'],
  os: ['windows', 'macos', 'linux', 'ios', 'android'],
  language: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
  device: ['desktop', 'mobile', 'tablet'],
  platform: ['web', 'ios', 'android', 'api']
};

// Email patterns for MATCHES operator
const EMAIL_PATTERNS = [
  '@example\\.com', '@test\\.com', '@company\\.com', '@acme\\.com',
  '.*@gmail\\.com', '.*@yahoo\\.com', '.*@hotmail\\.com'
];

class FlagGenerator {
  private totalFlags: number;
  private outputPath: string;

  constructor(totalFlags: number, outputPath: string = 'ufc') {
    this.totalFlags = totalFlags;
    this.outputPath = outputPath;
  }

  // Generate random string
  private generateRandomString(length: number = 8): string {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
  }

  // Generate random integer
  private generateRandomInt(min: number = 1, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Generate random boolean
  private generateRandomBoolean(): boolean {
    return Math.random() < 0.5;
  }

  // Generate random numeric value
  private generateRandomNumeric(): number {
    return Math.round((Math.random() * 100) * 100) / 100; // 2 decimal places
  }

  // Generate variations based on type
  private generateVariations(type: VariationType, flagKey: string): Record<string, Variation> {
    const variations: Record<string, Variation> = {};

    switch (type) {
      case 'STRING':
        const stringCount = Math.floor(Math.random() * 4) + 2; // 2-5 variations
        const stringNames = ['control', 'variant-a', 'variant-b', 'variant-c', 'variant-d'];
        for (let i = 0; i < stringCount; i++) {
          const key = stringNames[i] || `variant-${i}`;
          variations[key] = {
            key,
            value: `${flagKey}-${key}-value`
          };
        }
        break;

      case 'INTEGER':
        const intCount = Math.floor(Math.random() * 3) + 2; // 2-4 variations
        for (let i = 0; i < intCount; i++) {
          const key = `value-${i + 1}`;
          variations[key] = {
            key,
            value: this.generateRandomInt(1, 1000)
          };
        }
        break;

      case 'BOOLEAN':
        variations['on'] = { key: 'on', value: true };
        variations['off'] = { key: 'off', value: false };
        break;

      case 'NUMERIC':
        const numCount = Math.floor(Math.random() * 3) + 2; // 2-4 variations
        const numNames = ['small', 'medium', 'large', 'extra-large'];
        for (let i = 0; i < numCount; i++) {
          const key = numNames[i] || `numeric-${i}`;
          variations[key] = {
            key,
            value: this.generateRandomNumeric()
          };
        }
        break;

      case 'JSON':
        const jsonCount = Math.floor(Math.random() * 3) + 2; // 2-4 variations
        const jsonNames = ['config-a', 'config-b', 'config-c', 'config-d'];
        for (let i = 0; i < jsonCount; i++) {
          const key = jsonNames[i] || `config-${i}`;
          const jsonValue = {
            enabled: this.generateRandomBoolean(),
            value: this.generateRandomInt(1, 100),
            label: `Configuration ${i + 1}`,
            features: [`feature-${i + 1}`, `feature-${i + 2}`]
          };
          variations[key] = {
            key,
            value: JSON.stringify(jsonValue)
          };
        }
        break;
    }

    return variations;
  }

  // Generate random shard ranges
  private generateShardRanges(totalAllocation: number = TOTAL_SHARDS): ShardRange[] {
    const ranges: ShardRange[] = [];
    let start = 0;
    let remaining = totalAllocation;

    while (remaining > 0 && start < totalAllocation) {
      const size = Math.min(remaining, Math.floor(Math.random() * remaining) + 1);
      ranges.push({
        start,
        end: start + size
      });
      start += size;
      remaining -= size;
    }

    return ranges;
  }

  // Generate rule conditions
  private generateRuleConditions(): Condition[] {
    const conditions: Condition[] = [];
    const numConditions = Math.floor(Math.random() * 3) + 1; // 1-3 conditions

    for (let i = 0; i < numConditions; i++) {
      const attribute = ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)];
      const operator = OPERATORS[Math.floor(Math.random() * OPERATORS.length)] as Operator;

      let value: string | number | boolean | string[];

      switch (operator) {
        case 'ONE_OF':
        case 'NOT_ONE_OF':
          if (ATTRIBUTE_VALUES[attribute]) {
            const values = ATTRIBUTE_VALUES[attribute];
            const selectedValues = values.slice(0, Math.floor(Math.random() * 3) + 1);
            value = selectedValues;
          } else {
            value = [`${attribute}-value-${this.generateRandomInt(1, 10)}`];
          }
          break;

        case 'MATCHES':
        case 'NOT_MATCHES':
          if (attribute === 'email') {
            value = EMAIL_PATTERNS[Math.floor(Math.random() * EMAIL_PATTERNS.length)];
          } else if (attribute === 'version') {
            value = `^${this.generateRandomInt(1, 5)}\\.\\d+\\.\\d+`;
          } else {
            value = `${attribute}.*pattern`;
          }
          break;

        case 'LT':
        case 'LTE':
        case 'GT':
        case 'GTE':
          if (attribute === 'age') {
            value = this.generateRandomInt(18, 65);
          } else if (attribute === 'size') {
            value = this.generateRandomInt(1, 1000);
          } else if (attribute === 'version') {
            value = `${this.generateRandomInt(1, 5)}.${this.generateRandomInt(0, 9)}.${this.generateRandomInt(0, 9)}`;
          } else {
            value = this.generateRandomInt(1, 100);
          }
          break;

        case 'IS_NULL':
          value = this.generateRandomBoolean();
          break;

        default:
          value = `${attribute}-default-value`;
      }

      conditions.push({
        attribute,
        operator,
        value
      });
    }

    return conditions;
  }

  // Generate allocations for a flag
  private generateAllocations(variations: Record<string, Variation>): Allocation[] {
    const allocations: Allocation[] = [];
    const variationKeys = Object.keys(variations);
    const numAllocations = Math.floor(Math.random() * 3) + 1; // 1-3 allocations

    for (let i = 0; i < numAllocations; i++) {
      const allocation: Allocation = {
        key: `allocation-${i + 1}`,
        rules: [],
        splits: [],
        doLog: this.generateRandomBoolean()
      };

      // Generate rules (some allocations have no rules for fallback)
      if (Math.random() > 0.3) { // 70% chance of having rules
        const numRules = Math.floor(Math.random() * 2) + 1; // 1-2 rules
        for (let j = 0; j < numRules; j++) {
          allocation.rules.push({
            conditions: this.generateRuleConditions()
          });
        }
      }

      // Generate splits
      const numSplits = Math.floor(Math.random() * Math.min(3, variationKeys.length)) + 1;
      const selectedVariations = variationKeys.slice(0, numSplits);

      selectedVariations.forEach((variationKey, index) => {
        const split: Split = {
          variationKey,
          shards: []
        };

        // Add shards for traffic allocation (some splits have empty shards)
        if (Math.random() > 0.2) { // 80% chance of having shards
          const salt = `${allocation.key}-${variationKey}-salt`;
          const ranges = this.generateShardRanges(Math.floor(Math.random() * TOTAL_SHARDS) + 1000);

          split.shards.push({
            salt,
            ranges
          });
        }

        // Add extra logging occasionally
        if (Math.random() > 0.8) { // 20% chance
          split.extraLogging = {
            allocation_type: i === 0 ? 'experiment' : 'rollout',
            owner: `team-${Math.floor(Math.random() * 5) + 1}`
          };
        }

        allocation.splits.push(split);
      });

      // Add start/end dates occasionally
      if (Math.random() > 0.9) { // 10% chance
        const now = new Date();
        if (Math.random() > 0.5) {
          allocation.startAt = new Date(now.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString();
        }
        if (Math.random() > 0.7) {
          allocation.endAt = new Date(now.getTime() + Math.random() * 730 * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      allocations.push(allocation);
    }

    return allocations;
  }

  // Generate a single flag
  private generateFlag(index: number): Flag {
    const flagKey = `test-flag-${String(index + 1).padStart(4, '0')}`;
    const variationType = VARIATION_TYPES[Math.floor(Math.random() * VARIATION_TYPES.length)];
    const enabled = Math.random() > 0.1; // 90% enabled

    const variations = this.generateVariations(variationType, flagKey);
    const allocations = this.generateAllocations(variations);

    const flag: Flag = {
      key: flagKey,
      enabled,
      variationType,
      variations,
      allocations,
      totalShards: TOTAL_SHARDS
    };

    // Add comment occasionally
    if (Math.random() > 0.8) { // 20% chance
      flag.comment = `Generated test flag ${index + 1} for ${variationType.toLowerCase()} testing`;
    }

    return flag;
  }

  // Generate all flags
  public generateAllFlags(): Record<string, Flag> {
    console.log(`Generating ${this.totalFlags} test flags...`);

    const flags: Record<string, Flag> = {};

    for (let i = 0; i < this.totalFlags; i++) {
      const flag = this.generateFlag(i);
      flags[flag.key] = flag;

      if ((i + 1) % 100 === 0) {
        console.log(`Generated ${i + 1} flags...`);
      }
    }

    return flags;
  }

  // Create the complete configuration object
  public createConfiguration(flags: Record<string, Flag>): Configuration {
    return {
      createdAt: new Date().toISOString(),
      format: "SERVER",
      environment: {
        name: `Test-${this.totalFlags}`
      },
      flags
    };
  }

  // Main execution
  public generate(): void {
    try {
      console.log('Starting flag generation...');

      const flags = this.generateAllFlags();
      const configuration = this.createConfiguration(flags);

      const outputFile = path.join(this.outputPath, `flags-${this.totalFlags}.json`);

      // Ensure output directory exists
      if (!fs.existsSync(this.outputPath)) {
        fs.mkdirSync(this.outputPath, { recursive: true });
      }

      console.log(`Writing configuration to ${outputFile}...`);
      fs.writeFileSync(outputFile, JSON.stringify(configuration, null, 2));

      console.log(`✅ Successfully generated ${this.totalFlags} flags in ${outputFile}`);
      console.log(`📊 Flag type distribution:`);

      // Show distribution
      const typeCount: Record<string, number> = {};
      Object.values(flags).forEach(flag => {
        typeCount[flag.variationType] = (typeCount[flag.variationType] || 0) + 1;
      });

      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} flags`);
      });

      console.log(`📋 Total enabled flags: ${Object.values(flags).filter(f => f.enabled).length}`);
      console.log(`📋 Total disabled flags: ${Object.values(flags).filter(f => !f.enabled).length}`);

    } catch (error) {
      console.error('Error generating flags:', error);
      process.exit(1);
    }
  }
}

// Command line interface
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npx ts-node generate-flags.ts <number-of-flags> [output-path]

Generate feature flags for testing purposes.

Arguments:
  number-of-flags    Number of flags to generate (required)
  output-path        Output directory path (optional, default: "ufc")

Options:
  -h, --help        Show this help message

Examples:
  npx ts-node generate-flags.ts 2000           Generate 2000 flags in ./ufc/
  npx ts-node generate-flags.ts 100 test-data  Generate 100 flags in ./test-data/
  npx ts-node generate-flags.ts 500 ../output  Generate 500 flags in ../output/
    `);
    process.exit(0);
  }

  const numFlags = parseInt(args[0], 10);

  if (isNaN(numFlags) || numFlags <= 0) {
    console.error('Error: Please provide a valid positive number of flags to generate.');
    process.exit(1);
  }

  if (numFlags > 10000) {
    console.error('Error: Maximum number of flags is 10,000 to prevent excessive file sizes.');
    process.exit(1);
  }

  const outputPath = args[1] || 'ufc';

  const generator = new FlagGenerator(numFlags, outputPath);
  generator.generate();
}

// Run the script
if (require.main === module) {
  main();
}

export { FlagGenerator, Configuration, Flag };