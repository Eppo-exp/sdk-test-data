#!/usr/bin/env npx ts-node

import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';

// Types from existing test structure
interface SubjectTestCase {
  subjectKey: string;
  subjectAttributes: Record<string, any>;
  assignment: any;
  evaluationDetails: FlagEvaluationDetails;
}

interface FlagEvaluationDetails {
  environmentName: string;
  flagEvaluationCode: string;
  flagEvaluationDescription: string;
  banditKey: null;
  banditAction: null;
  variationKey: string | null;
  variationValue: any;
  matchedRule: any;
  matchedAllocation: AllocationEvaluation | null;
  unmatchedAllocations: AllocationEvaluation[];
  unevaluatedAllocations: AllocationEvaluation[];
}

interface AllocationEvaluation {
  key: string;
  allocationEvaluationCode: string;
  orderPosition: number;
}

interface AssignmentTestCase {
  flag: string;
  variationType: string;
  defaultValue: any;
  subjects: SubjectTestCase[];
}

// Import flag types
interface Condition {
  attribute: string;
  operator: string;
  value: any;
}

interface Rule {
  conditions: Condition[];
}

interface ShardRange {
  start: number;
  end: number;
}

interface Shard {
  salt: string;
  ranges: ShardRange[];
}

interface Split {
  variationKey: string;
  shards: Shard[];
}

interface Allocation {
  key: string;
  rules: Rule[];
  splits: Split[];
  doLog: boolean;
  startAt?: string;
  endAt?: string;
}

interface Variation {
  key: string;
  value: any;
}

interface Flag {
  key: string;
  enabled: boolean;
  variationType: string;
  variations: Record<string, Variation>;
  allocations: Allocation[];
  totalShards: number;
}

interface Configuration {
  flags: Record<string, Flag>;
}

class PerformanceTestCaseGenerator {
  private flags: Record<string, Flag>;
  private outputPath: string;

  // Realistic attribute values for matching
  private readonly ATTRIBUTE_VALUES: Record<string, string[]> = {
    country: ['US', 'Canada', 'Mexico', 'UK', 'Germany', 'France', 'Japan', 'Australia', 'Ukraine'],
    region: ['North America', 'Europe', 'Asia', 'South America'],
    plan: ['free', 'basic', 'premium', 'enterprise'],
    accountType: ['individual', 'business', 'nonprofit'],
    subscription: ['trial', 'monthly', 'yearly'],
    browser: ['chrome', 'firefox', 'safari', 'edge'],
    os: ['windows', 'macos', 'linux', 'ios', 'android'],
    language: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
    device: ['desktop', 'mobile', 'tablet'],
    platform: ['web', 'ios', 'android', 'api'],
    email: [
      'alice@example.com', 'bob@test.com', 'user@company.com',
      'admin@acme.com', 'test@gmail.com', 'user@yahoo.com'
    ]
  };

  constructor(flagsFile: string, outputPath: string = 'ufc/generated-tests') {
    const configData = fs.readFileSync(flagsFile, 'utf8');
    const config: Configuration = JSON.parse(configData);
    this.flags = config.flags;
    this.outputPath = outputPath;
  }

  // MD5 hashing for shard calculation (matches iOS implementation)
  private calculateShard(input: string, totalShards: number): number {
    const hash = crypto.createHash('md5').update(input).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    return hashValue % totalShards;
  }

  // Check if subject falls within shard ranges
  private matchesShard(shard: Shard, subjectKey: string, totalShards: number): boolean {
    const hashInput = `${shard.salt}-${subjectKey}`;
    const shardValue = this.calculateShard(hashInput, totalShards);

    return shard.ranges.some(range =>
      range.start <= shardValue && shardValue < range.end
    );
  }

  // Check if subject matches all shards in a split
  private matchesSplit(split: Split, subjectKey: string, totalShards: number): boolean {
    if (split.shards.length === 0) return true; // Empty shards = always match

    // ALL shards must match (AND logic)
    return split.shards.every(shard =>
      this.matchesShard(shard, subjectKey, totalShards)
    );
  }

  // Evaluate a single condition
  private evaluateCondition(condition: Condition, attributeValue: any): boolean {
    const { attribute, operator, value } = condition;

    // Handle IS_NULL specially
    if (operator === 'IS_NULL') {
      const isNull = attributeValue === null || attributeValue === undefined;
      return value === isNull;
    }

    // For other operators, null values fail
    if (attributeValue === null || attributeValue === undefined) {
      return false;
    }

    switch (operator) {
      case 'ONE_OF':
        return Array.isArray(value) ? value.includes(String(attributeValue)) : false;

      case 'NOT_ONE_OF':
        return Array.isArray(value) ? !value.includes(String(attributeValue)) : true;

      case 'MATCHES':
        try {
          const regex = new RegExp(String(value));
          return regex.test(String(attributeValue));
        } catch {
          return false;
        }

      case 'NOT_MATCHES':
        try {
          const regex = new RegExp(String(value));
          return !regex.test(String(attributeValue));
        } catch {
          return true;
        }

      case 'LT':
        return Number(attributeValue) < Number(value);

      case 'LTE':
        return Number(attributeValue) <= Number(value);

      case 'GT':
        return Number(attributeValue) > Number(value);

      case 'GTE':
        return Number(attributeValue) >= Number(value);

      default:
        return false;
    }
  }

  // Check if a rule matches (ALL conditions must match - AND logic)
  private matchesRule(rule: Rule, subjectAttributes: Record<string, any>, subjectKey: string): boolean {
    return rule.conditions.every(condition => {
      // Handle "id" attribute fallback
      let attributeValue = subjectAttributes[condition.attribute];
      if (attributeValue === undefined && condition.attribute === 'id') {
        attributeValue = subjectKey;
      }

      return this.evaluateCondition(condition, attributeValue);
    });
  }

  // Check if allocation matches (ANY rule must match - OR logic)
  private matchesAllocation(allocation: Allocation, subjectAttributes: Record<string, any>, subjectKey: string): boolean {
    // No rules = always match
    if (!allocation.rules || allocation.rules.length === 0) {
      return true;
    }

    // ANY rule must match (OR logic)
    return allocation.rules.some(rule =>
      this.matchesRule(rule, subjectAttributes, subjectKey)
    );
  }

  // Get default value based on variation type
  private getDefaultValue(flag: Flag): any {
    switch (flag.variationType) {
      case 'STRING': return 'default';
      case 'INTEGER': return 0;
      case 'BOOLEAN': return false;
      case 'NUMERIC': return 0.0;
      case 'JSON': return null;
      default: return null;
    }
  }

  // Simulate full flag evaluation (following iOS SDK logic)
  private evaluateFlag(flag: Flag, subjectKey: string, subjectAttributes: Record<string, any>): {
    assignment: any;
    evaluationDetails: FlagEvaluationDetails;
  } {
    // Check if flag is disabled
    if (!flag.enabled) {
      return {
        assignment: this.getDefaultValue(flag),
        evaluationDetails: {
          environmentName: 'Test',
          flagEvaluationCode: 'FLAG_UNRECOGNIZED_OR_DISABLED',
          flagEvaluationDescription: 'Flag is disabled',
          banditKey: null,
          banditAction: null,
          variationKey: null,
          variationValue: null,
          matchedRule: null,
          matchedAllocation: null,
          unmatchedAllocations: flag.allocations.map((alloc, idx) => ({
            key: alloc.key,
            allocationEvaluationCode: 'FLAG_UNRECOGNIZED_OR_DISABLED',
            orderPosition: idx
          })),
          unevaluatedAllocations: []
        }
      };
    }

    const unmatchedAllocations: AllocationEvaluation[] = [];
    const unevaluatedAllocations: AllocationEvaluation[] = [];

    // Evaluate allocations in order (first match wins)
    for (let i = 0; i < flag.allocations.length; i++) {
      const allocation = flag.allocations[i];

      // Check time constraints
      const now = new Date();
      if (allocation.startAt && new Date(allocation.startAt) > now) {
        unmatchedAllocations.push({
          key: allocation.key,
          allocationEvaluationCode: 'BEFORE_START_TIME',
          orderPosition: i
        });
        continue;
      }

      if (allocation.endAt && new Date(allocation.endAt) < now) {
        unmatchedAllocations.push({
          key: allocation.key,
          allocationEvaluationCode: 'AFTER_END_TIME',
          orderPosition: i
        });
        continue;
      }

      // Check targeting rules
      if (!this.matchesAllocation(allocation, subjectAttributes, subjectKey)) {
        unmatchedAllocations.push({
          key: allocation.key,
          allocationEvaluationCode: 'FAILING_RULE',
          orderPosition: i
        });
        continue;
      }

      // Check traffic splits
      let matchingSplit: Split | null = null;
      for (const split of allocation.splits) {
        if (this.matchesSplit(split, subjectKey, flag.totalShards)) {
          matchingSplit = split;
          break;
        }
      }

      if (!matchingSplit) {
        unmatchedAllocations.push({
          key: allocation.key,
          allocationEvaluationCode: 'TRAFFIC_EXPOSURE_MISS',
          orderPosition: i
        });
        continue;
      }

      // MATCH! Mark remaining allocations as unevaluated
      for (let j = i + 1; j < flag.allocations.length; j++) {
        unevaluatedAllocations.push({
          key: flag.allocations[j].key,
          allocationEvaluationCode: 'UNEVALUATED',
          orderPosition: j
        });
      }

      const variation = flag.variations[matchingSplit.variationKey];
      const matchedRule = allocation.rules && allocation.rules.length > 0
        ? allocation.rules.find(rule => this.matchesRule(rule, subjectAttributes, subjectKey)) || null
        : null;

      return {
        assignment: variation?.value || this.getDefaultValue(flag),
        evaluationDetails: {
          environmentName: 'Test',
          flagEvaluationCode: 'MATCH',
          flagEvaluationDescription: `Matched allocation "${allocation.key}"`,
          banditKey: null,
          banditAction: null,
          variationKey: matchingSplit.variationKey,
          variationValue: variation?.value || this.getDefaultValue(flag),
          matchedRule: matchedRule ? { conditions: matchedRule.conditions } : null,
          matchedAllocation: {
            key: allocation.key,
            allocationEvaluationCode: 'MATCH',
            orderPosition: i
          },
          unmatchedAllocations,
          unevaluatedAllocations
        }
      };
    }

    // No allocation matched
    return {
      assignment: this.getDefaultValue(flag),
      evaluationDetails: {
        environmentName: 'Test',
        flagEvaluationCode: 'DEFAULT_ALLOCATION_NULL',
        flagEvaluationDescription: 'No allocations matched',
        banditKey: null,
        banditAction: null,
        variationKey: null,
        variationValue: null,
        matchedRule: null,
        matchedAllocation: null,
        unmatchedAllocations,
        unevaluatedAllocations: []
      }
    };
  }

  // Generate attributes that will match specific conditions
  private generateMatchingAttributes(conditions: Condition[]): Record<string, any> {
    const attributes: Record<string, any> = {};

    conditions.forEach(condition => {
      const { attribute, operator, value } = condition;

      switch (operator) {
        case 'ONE_OF':
          if (Array.isArray(value) && value.length > 0) {
            attributes[attribute] = value[0];
          }
          break;

        case 'NOT_ONE_OF':
          const availableValues = this.ATTRIBUTE_VALUES[attribute] || ['test-value'];
          const excludeValues = Array.isArray(value) ? value : [value];
          const validValues = availableValues.filter((v: string) => !excludeValues.includes(v));
          attributes[attribute] = validValues[0] || 'other-value';
          break;

        case 'MATCHES':
          if (attribute === 'email') {
            if (typeof value === 'string') {
              if (value.includes('@example')) {
                attributes[attribute] = 'user@example.com';
              } else if (value.includes('@test')) {
                attributes[attribute] = 'user@test.com';
              } else if (value.includes('@company')) {
                attributes[attribute] = 'user@company.com';
              } else {
                attributes[attribute] = 'test@match.com';
              }
            }
          } else if (attribute === 'version') {
            attributes[attribute] = '2.1.0';
          } else {
            attributes[attribute] = 'matching-pattern';
          }
          break;

        case 'NOT_MATCHES':
          attributes[attribute] = 'no-match-value';
          break;

        case 'LT':
          attributes[attribute] = Math.max(0, Number(value) - 5);
          break;

        case 'LTE':
          attributes[attribute] = Number(value);
          break;

        case 'GT':
          attributes[attribute] = Number(value) + 5;
          break;

        case 'GTE':
          attributes[attribute] = Number(value);
          break;

        case 'IS_NULL':
          if (value === true) {
            // Don't set the attribute (making it null/undefined)
          } else {
            attributes[attribute] = 'some-value';
          }
          break;

        default:
          attributes[attribute] = 'test-value';
      }
    });

    return attributes;
  }

  // Generate a subject that will be in traffic for a specific allocation
  private generateTrafficMatchingSubject(flag: Flag, allocation: Allocation): string {
    if (allocation.splits.length === 0 || allocation.splits[0].shards.length === 0) {
      return 'traffic-match-subject';
    }

    const split = allocation.splits[0];
    const shard = split.shards[0];

    if (shard.ranges.length === 0) {
      return 'traffic-match-subject';
    }

    const targetRange = shard.ranges[0];

    // Try to find a subject key that falls in the target range
    for (let i = 0; i < 1000; i++) {
      const subjectKey = `subject-${i}`;
      const hashInput = `${shard.salt}-${subjectKey}`;
      const shardValue = this.calculateShard(hashInput, flag.totalShards);

      if (targetRange.start <= shardValue && shardValue < targetRange.end) {
        return subjectKey;
      }
    }

    return 'traffic-fallback-subject';
  }

  // Generate diverse test subjects for performance testing
  private generateSubjectsForFlag(flag: Flag): SubjectTestCase[] {
    const subjects: SubjectTestCase[] = [];

    // Generate a variety of subject scenarios to exercise different evaluation paths
    const testScenarios = [
      // Baseline: no attributes
      { key: 'baseline', attributes: {} },

      // Geographic targeting
      { key: 'us-user', attributes: { country: 'US', region: 'North America' } },
      { key: 'canada-user', attributes: { country: 'Canada', region: 'North America' } },
      { key: 'uk-user', attributes: { country: 'UK', region: 'Europe' } },

      // Demographic targeting
      { key: 'young-free', attributes: { age: 22, plan: 'free', accountType: 'individual' } },
      { key: 'mature-premium', attributes: { age: 45, plan: 'premium', accountType: 'business' } },
      { key: 'enterprise', attributes: { age: 35, plan: 'enterprise', accountType: 'business' } },

      // Technical targeting
      { key: 'mobile-chrome', attributes: { device: 'mobile', browser: 'chrome', os: 'android', platform: 'android' } },
      { key: 'desktop-safari', attributes: { device: 'desktop', browser: 'safari', os: 'macos', platform: 'web' } },
      { key: 'ios-app', attributes: { device: 'mobile', os: 'ios', platform: 'ios' } },

      // Email patterns
      { key: 'company-email', attributes: { email: 'user@company.com' } },
      { key: 'gmail-user', attributes: { email: 'test@gmail.com' } },
      { key: 'example-email', attributes: { email: 'demo@example.com' } },

      // Numeric values
      { key: 'version-old', attributes: { version: '1.2.3', age: 18 } },
      { key: 'version-new', attributes: { version: '3.1.0', age: 65 } },
      { key: 'size-small', attributes: { size: 5 } },
      { key: 'size-large', attributes: { size: 500 } },

      // Mixed complex attributes
      { key: 'complex-user', attributes: {
        country: 'Germany', age: 28, plan: 'basic', device: 'tablet',
        email: 'user@test.com', version: '2.5.1', size: 100
      }},

      // Edge cases
      { key: 'null-attrs', attributes: { country: null, age: null } },
      { key: 'empty-strings', attributes: { plan: '', email: '', browser: '' } },
      { key: 'id-user', attributes: { id: 'special-id-123' } }
    ];

    // For each scenario, evaluate against the flag and capture actual results
    testScenarios.forEach(scenario => {
      const result = this.evaluateFlag(flag, scenario.key, scenario.attributes);

      subjects.push({
        subjectKey: scenario.key,
        subjectAttributes: scenario.attributes,
        assignment: result.assignment,
        evaluationDetails: result.evaluationDetails
      });
    });

    return subjects;
  }

  // Group flags by similar characteristics
  private categorizeFlagsByRules(): Record<string, Flag[]> {
    const categories: Record<string, Flag[]> = {
      geographic: [],
      demographic: [],
      technical: [],
      email_matching: [],
      numeric_comparisons: [],
      simple_rules: []
    };

    Object.values(this.flags).forEach(flag => {
      if (!flag.enabled || flag.allocations.length === 0) return;

      const hasGeographic = this.flagHasAttribute(flag, ['country', 'region']);
      const hasDemographic = this.flagHasAttribute(flag, ['age', 'plan', 'subscription']);
      const hasTechnical = this.flagHasAttribute(flag, ['browser', 'os', 'device', 'platform']);
      const hasEmailMatching = this.flagHasEmailMatching(flag);
      const hasNumericComparisons = this.flagHasNumericOperators(flag);

      if (hasGeographic) categories.geographic.push(flag);
      else if (hasDemographic) categories.demographic.push(flag);
      else if (hasTechnical) categories.technical.push(flag);
      else if (hasEmailMatching) categories.email_matching.push(flag);
      else if (hasNumericComparisons) categories.numeric_comparisons.push(flag);
      else categories.simple_rules.push(flag);
    });

    return categories;
  }

  private flagHasAttribute(flag: Flag, attributes: string[]): boolean {
    return flag.allocations.some(alloc =>
      alloc.rules && alloc.rules.some(rule =>
        rule.conditions.some(cond =>
          attributes.includes(cond.attribute)
        )
      )
    );
  }

  private flagHasEmailMatching(flag: Flag): boolean {
    return flag.allocations.some(alloc =>
      alloc.rules && alloc.rules.some(rule =>
        rule.conditions.some(cond =>
          cond.attribute === 'email' && cond.operator === 'MATCHES'
        )
      )
    );
  }

  private flagHasNumericOperators(flag: Flag): boolean {
    const numericOps = ['LT', 'LTE', 'GT', 'GTE'];
    return flag.allocations.some(alloc =>
      alloc.rules && alloc.rules.some(rule =>
        rule.conditions.some(cond =>
          numericOps.includes(cond.operator)
        )
      )
    );
  }

  // Generate batch test files
  public generateBatchTests(): void {
    const categories = this.categorizeFlagsByRules();

    // Ensure output directory exists
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }

    Object.entries(categories).forEach(([categoryName, flags]) => {
      if (flags.length === 0) return;

      // Pick the first few flags from each category for testing
      const testFlags = flags.slice(0, Math.min(2, flags.length));

      testFlags.forEach((flag, index) => {
        const subjects = this.generateSubjectsForFlag(flag);

        const testCase: AssignmentTestCase = {
          flag: flag.key,
          variationType: flag.variationType,
          defaultValue: this.getDefaultValue(flag),
          subjects
        };

        const filename = `test-${categoryName}-${index + 1}.json`;
        const filepath = path.join(this.outputPath, filename);

        fs.writeFileSync(filepath, JSON.stringify(testCase, null, 2));

        console.log(`✅ Generated ${subjects.length} test subjects for ${flag.key} (${categoryName})`);
      });
    });

    console.log(`🎯 Generated batch test files in ${this.outputPath}`);
  }
}

// Command line interface
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npx ts-node generate-test-cases.ts <flags-file> [output-path]

Generate test cases based on actual iOS SDK evaluation logic.

Arguments:
  flags-file     Path to the flags JSON file (e.g., ufc/flags-2000.json)
  output-path    Output directory (optional, default: "ufc/generated-tests")

Examples:
  npx ts-node generate-test-cases.ts ufc/flags-2000.json
  npx ts-node generate-test-cases.ts ufc/flags-1000.json custom-tests/
    `);
    process.exit(0);
  }

  const flagsFile = args[0];
  const outputPath = args[1] || 'ufc/generated-tests';

  if (!fs.existsSync(flagsFile)) {
    console.error(`Error: Flags file "${flagsFile}" not found.`);
    process.exit(1);
  }

  try {
    const generator = new PerformanceTestCaseGenerator(flagsFile, outputPath);
    generator.generateBatchTests();
  } catch (error) {
    console.error('Error generating test cases:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { PerformanceTestCaseGenerator };