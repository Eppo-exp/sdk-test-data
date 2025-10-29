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

// Import flag types (simplified versions)
interface Condition {
  attribute: string;
  operator: string;
  value: any;
}

interface Rule {
  conditions: Condition[];
}

interface Allocation {
  key: string;
  rules: Rule[];
  splits: any[];
  doLog: boolean;
}

interface Flag {
  key: string;
  enabled: boolean;
  variationType: string;
  variations: Record<string, any>;
  allocations: Allocation[];
  totalShards: number;
}

interface Configuration {
  flags: Record<string, Flag>;
}

class TestCaseGenerator {
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

  // Generate attributes that will MATCH the given conditions
  private generateMatchingAttributes(conditions: Condition[]): Record<string, any> {
    const attributes: Record<string, any> = {};

    conditions.forEach(condition => {
      const { attribute, operator, value } = condition;

      switch (operator) {
        case 'ONE_OF':
          // Pick first value from the array
          if (Array.isArray(value) && value.length > 0) {
            attributes[attribute] = value[0];
          }
          break;

        case 'NOT_ONE_OF':
          // Pick a value NOT in the array
          const availableValues = this.ATTRIBUTE_VALUES[attribute] || ['test-value'];
          const excludeValues = Array.isArray(value) ? value : [value];
          const validValues = availableValues.filter((v: string) => !excludeValues.includes(v));
          if (validValues.length > 0) {
            attributes[attribute] = validValues[0];
          } else {
            attributes[attribute] = 'other-value';
          }
          break;

        case 'MATCHES':
          // Generate string that would match the regex pattern
          if (attribute === 'email') {
            if (typeof value === 'string') {
              if (value.includes('@example')) {
                attributes[attribute] = 'user@example.com';
              } else if (value.includes('@test')) {
                attributes[attribute] = 'user@test.com';
              } else if (value.includes('@gmail')) {
                attributes[attribute] = 'user@gmail.com';
              } else {
                attributes[attribute] = 'user@company.com';
              }
            }
          } else if (attribute === 'version') {
            attributes[attribute] = '2.1.0'; // Common version format
          } else {
            attributes[attribute] = `${attribute}-matching-value`;
          }
          break;

        case 'NOT_MATCHES':
          // Generate string that would NOT match
          if (attribute === 'email') {
            attributes[attribute] = 'nomatch@different.org';
          } else {
            attributes[attribute] = 'no-match-value';
          }
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
          // Fallback
          attributes[attribute] = 'test-value';
      }
    });

    return attributes;
  }

  // Generate attributes that will FAIL the given conditions
  private generateFailingAttributes(conditions: Condition[]): Record<string, any> {
    const attributes: Record<string, any> = {};

    conditions.forEach(condition => {
      const { attribute, operator, value } = condition;

      switch (operator) {
        case 'ONE_OF':
          // Pick a value NOT in the array
          const availableValues = this.ATTRIBUTE_VALUES[attribute] || ['other-value'];
          const excludeValues = Array.isArray(value) ? value : [value];
          const validValues = availableValues.filter((v: string) => !excludeValues.includes(v));
          attributes[attribute] = validValues[0] || 'fail-value';
          break;

        case 'NOT_ONE_OF':
          // Pick first value from the excluded array
          if (Array.isArray(value) && value.length > 0) {
            attributes[attribute] = value[0];
          }
          break;

        case 'LT':
          attributes[attribute] = Number(value) + 5;
          break;

        case 'GT':
          attributes[attribute] = Math.max(0, Number(value) - 5);
          break;

        // ... other operators (invert the logic from matching)

        default:
          attributes[attribute] = 'fail-value';
      }
    });

    return attributes;
  }

  // Get expected variation for a matching allocation
  private getExpectedVariation(flag: Flag, allocation: Allocation): any {
    if (allocation.splits && allocation.splits.length > 0) {
      const variationKey = allocation.splits[0].variationKey;
      return flag.variations[variationKey]?.value || null;
    }
    return null;
  }

  // Generate test subjects for a single flag
  private generateSubjectsForFlag(flag: Flag): SubjectTestCase[] {
    const subjects: SubjectTestCase[] = [];

    // 1. Generate subjects that MATCH each allocation
    flag.allocations.forEach((allocation, allocIndex) => {
      if (allocation.rules && allocation.rules.length > 0) {
        allocation.rules.forEach((rule, ruleIndex) => {
          // Matching subject
          const matchingAttrs = this.generateMatchingAttributes(rule.conditions);
          const expectedValue = this.getExpectedVariation(flag, allocation);

          subjects.push({
            subjectKey: `match-${allocation.key}-rule-${ruleIndex}`,
            subjectAttributes: matchingAttrs,
            assignment: expectedValue,
            evaluationDetails: {
              environmentName: 'Test',
              flagEvaluationCode: 'MATCH',
              flagEvaluationDescription: `Matched allocation "${allocation.key}"`,
              banditKey: null,
              banditAction: null,
              variationKey: allocation.splits[0]?.variationKey || null,
              variationValue: expectedValue,
              matchedRule: { conditions: rule.conditions },
              matchedAllocation: {
                key: allocation.key,
                allocationEvaluationCode: 'MATCH',
                orderPosition: allocIndex
              },
              unmatchedAllocations: [],
              unevaluatedAllocations: []
            }
          });

          // Failing subject
          const failingAttrs = this.generateFailingAttributes(rule.conditions);
          subjects.push({
            subjectKey: `fail-${allocation.key}-rule-${ruleIndex}`,
            subjectAttributes: failingAttrs,
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
              unmatchedAllocations: [{
                key: allocation.key,
                allocationEvaluationCode: 'FAILING_RULE',
                orderPosition: allocIndex
              }],
              unevaluatedAllocations: []
            }
          });
        });
      }
    });

    // 2. Add a baseline subject that gets default (no attributes)
    subjects.push({
      subjectKey: 'baseline-no-attributes',
      subjectAttributes: {},
      assignment: this.getDefaultValue(flag),
      evaluationDetails: {
        environmentName: 'Test',
        flagEvaluationCode: 'DEFAULT_ALLOCATION_NULL',
        flagEvaluationDescription: 'No allocations matched due to missing attributes',
        banditKey: null,
        banditAction: null,
        variationKey: null,
        variationValue: null,
        matchedRule: null,
        matchedAllocation: null,
        unmatchedAllocations: flag.allocations.map((alloc, idx) => ({
          key: alloc.key,
          allocationEvaluationCode: 'FAILING_RULE',
          orderPosition: idx
        })),
        unevaluatedAllocations: []
      }
    });

    return subjects;
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

  // Group flags by similar characteristics for batch testing
  private categorizeFlagsByRules(): Record<string, Flag[]> {
    const categories: Record<string, Flag[]> = {
      geographic: [],
      demographic: [],
      technical: [],
      email_matching: [],
      numeric_comparisons: [],
      complex_rules: []
    };

    Object.values(this.flags).forEach(flag => {
      if (!flag.enabled || flag.allocations.length === 0) return;

      const hasGeographic = this.flagHasAttribute(flag, ['country', 'region']);
      const hasDemographic = this.flagHasAttribute(flag, ['age', 'plan', 'subscription']);
      const hasTechnical = this.flagHasAttribute(flag, ['browser', 'os', 'device', 'platform']);
      const hasEmailMatching = this.flagHasEmailMatching(flag);
      const hasNumericComparisons = this.flagHasNumericOperators(flag);
      const hasComplexRules = this.flagHasMultipleConditions(flag);

      if (hasGeographic) categories.geographic.push(flag);
      else if (hasDemographic) categories.demographic.push(flag);
      else if (hasTechnical) categories.technical.push(flag);
      else if (hasEmailMatching) categories.email_matching.push(flag);
      else if (hasNumericComparisons) categories.numeric_comparisons.push(flag);
      else if (hasComplexRules) categories.complex_rules.push(flag);
    });

    return categories;
  }

  private flagHasAttribute(flag: Flag, attributes: string[]): boolean {
    return flag.allocations.some(alloc =>
      alloc.rules.some(rule =>
        rule.conditions.some(cond =>
          attributes.includes(cond.attribute)
        )
      )
    );
  }

  private flagHasEmailMatching(flag: Flag): boolean {
    return flag.allocations.some(alloc =>
      alloc.rules.some(rule =>
        rule.conditions.some(cond =>
          cond.attribute === 'email' && cond.operator === 'MATCHES'
        )
      )
    );
  }

  private flagHasNumericOperators(flag: Flag): boolean {
    const numericOps = ['LT', 'LTE', 'GT', 'GTE'];
    return flag.allocations.some(alloc =>
      alloc.rules.some(rule =>
        rule.conditions.some(cond =>
          numericOps.includes(cond.operator)
        )
      )
    );
  }

  private flagHasMultipleConditions(flag: Flag): boolean {
    return flag.allocations.some(alloc =>
      alloc.rules.some(rule =>
        rule.conditions.length > 2
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
      const testFlags = flags.slice(0, Math.min(3, flags.length));

      testFlags.forEach((flag, index) => {
        const subjects = this.generateSubjectsForFlag(flag);

        const testCase: AssignmentTestCase = {
          flag: flag.key,
          variationType: flag.variationType,
          defaultValue: this.getDefaultValue(flag),
          subjects
        };

        const filename = `test-generated-${categoryName}-${index + 1}.json`;
        const filepath = path.join(this.outputPath, filename);

        fs.writeFileSync(filepath, JSON.stringify(testCase, null, 2));

        console.log(`✅ Generated ${subjects.length} test subjects for ${flag.key} (${categoryName})`);
      });
    });

    console.log(`🎯 Generated batch test files in ${this.outputPath}`);
    console.log(`📊 Categories tested: ${Object.keys(categories).filter(k => categories[k].length > 0).join(', ')}`);
  }
}

// Command line interface
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npx ts-node generate-test-cases.ts <flags-file> [output-path]

Generate test cases for flags with subjects that actually match the flag rules.

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
    const generator = new TestCaseGenerator(flagsFile, outputPath);
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

export { TestCaseGenerator };