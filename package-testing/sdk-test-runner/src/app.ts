import axios from 'axios';
import * as fs from 'fs';
import path from 'path';
import { green, log, logIndent, red, yellow } from './logging';
import { AssignmentRequest } from './dto/assignmentRequest';
import { isEqual } from 'lodash';
import { BanditActionRequest } from './dto/banditActionRequest';
import { TestResponse } from './dto/testResponse';
import { Scenario, Scenarios } from './dto/scenario';
import { TestCase, TestSuite, TestSuiteReport, getJunitXml } from 'junit-xml';
import { Config, SdkType } from './config';
import {
  ClientSDKRelay,
  FeatureNotSupportedError,
  SDKConnectionFailure,
  SDKInfo,
  SDKRelay,
  ServerSDKRelay,
} from './protocol';

export default class App {
  private readonly config: Config;

  public constructor(config: Config) {
    this.config = config;
  }

  public async run() {
    this.printHeader();

    const testingResult = await (this.config.sdkType === SdkType.SERVER ? this.runServerTest() : this.runClientTest());

    // Exit 0 if the test run was successful.
    const exitCode = testingResult ? 0 : 1;
    process.exit(exitCode);
  }

  public async runClientTest(): Promise<boolean> {
    log('Waiting for SDK Client to connect');

    const sdkRelay = new ClientSDKRelay();
    const sdkInfo = await sdkRelay.isReady();
    if ('errorMessage' in sdkInfo) {
      const error = sdkInfo as SDKConnectionFailure;
      log(red('SDK Relay Client failed to load: '));
      log(red(error.errorMessage));
      return false;
    }

    const sdk = sdkInfo as SDKInfo;
    log(`Sending test requests to ${sdk.sdkName}`);

    return this.innerRun(sdkRelay);
  }

  public async runServerTest(): Promise<boolean> {
    this.printHeader();

    const sdkRelay = new ServerSDKRelay(this.config.sdkServer, this.config.sdkName);
    const sdkInfo = await sdkRelay.isReady();
    if ('errorMessage' in sdkInfo && typeof sdkInfo.errorMessage === 'string') {
      const error = sdkInfo as SDKConnectionFailure;
      log(red('SDK Relay Server failed to load: '));
      log(red(error.errorMessage));
      return false;
    }

    log(`Posting test cases to ${this.config.sdkName} relay server at ${this.config.sdkServer}`);

    return this.innerRun(sdkRelay);
  }

  private printHeader(): void {
    log(`Running tests for ${this.config.sdkType} SDK: ${this.config.sdkName}`);
    log(`Test Cluster Details`);
    log(`API/Configuration server: ${this.config.apiServer}`);

    if (this.config.sdkType === SdkType.SERVER) {
      log(`SDK Relay server: ${this.config.sdkServer}`);
    }
  }

  private async innerRun(sdkRelay: SDKRelay): Promise<boolean> {
    const testConfig = JSON.parse(
      fs.readFileSync(path.join(this.config.testDataPath, this.config.scenarioFile), 'utf-8'),
    );
    const scenarios = testConfig['scenarios'] as Scenarios;

    if (Object.keys(scenarios).length === 0) {
      log(red('Error: empty scenario list'));
      return false;
    }

    const testSuiteResults: TestSuite[] = await this.runTestScenarios(scenarios, sdkRelay);

    const numTestCases = testSuiteResults.reduce((prev, cur) => prev + cur.testCases.length, 0);

    const numFailures = testSuiteResults.reduce(
      (prev, cur) => cur.testCases.filter((testCase) => testCase?.errors || testCase?.failures).length + prev,
      0,
    );

    const numSkipped = testSuiteResults.reduce(
      (prev, cur) => cur.testCases.filter((testCase) => testCase.skipped).length + prev,
      0,
    );

    const passes = numTestCases - numFailures - numSkipped;

    log(`*** Test Results for ${this.config.sdkName} *** `);
    const skippedText = numSkipped > 0 ? ` (${numSkipped} skipped)` : '';
    log(green(`${passes}/${numTestCases} passed${skippedText}`));

    const failureFunc = numFailures > 0 ? red : green;
    log(failureFunc(`${numFailures} failures`));

    // Junit support.
    if (this.config.junitFilePath) {
      const reportName = `Eppo SDK Test: ${this.config.sdkName}`;
      this.writeJUnitReport(testSuiteResults, reportName, this.config.junitFilePath);
    }

    return numFailures === 0;
  }

  async runTestScenarios(scenarios: Scenarios, sdkRelay: SDKRelay): Promise<TestSuite[]> {
    const suites: TestSuite[] = [];

    for (const scenarioName of Object.keys(scenarios)) {
      suites.push(await this.testScenario(scenarioName, scenarios[scenarioName], sdkRelay));
    }
    return suites;
  }

  writeJUnitReport(testSuites: TestSuite[], reportName: string, junitFile: string) {
    const testSuiteReport: TestSuiteReport = {
      name: reportName,
      suites: testSuites,
    };
    const junitXml = getJunitXml(testSuiteReport);
    fs.writeFileSync('./' + junitFile, junitXml);

    log(green(`Test results written to ${junitFile}`));
  }

  private testScenario = async (scenarioName: string, scenario: Scenario, sdkRelay: SDKRelay): Promise<TestSuite> => {
    const safeSdkName = encodeURIComponent(this.config.sdkName);
    const testCaseResults: TestCase[] = [];

    const suite: TestSuite = { name: scenarioName, timestamp: new Date(), testCases: testCaseResults };

    const scenarioSet = (await axios
      .post(`${this.config.apiServer}/sdk/${safeSdkName}/scenario`, { label: scenarioName })
      .then((result) => {
        if (result.status !== 200) {
          throw new Error(`API Server returned unexpected status: ${result.status}`);
        } else {
          log(`Set Testing Scenario to ${scenarioName}`);
          return { name: `Set Testing Scenario to ${scenarioName}`, assertions: 1 };
        }
      })
      .catch((error) => {
        log(red('Error encountered when setting test scenario:', error));
        return { name: `Set Testing Scenario to ${scenarioName}`, errors: [error.message] };
      })) as TestCase;

    testCaseResults.push(scenarioSet);

    if (scenarioSet.errors && scenarioSet.errors.length > 0) {
      // Early return.
      return suite;
    }

    // Reset the SDK relay to force a reload of configuration.
    const sdkReady = (await sdkRelay
      .reset()
      .then(() => {
        log(green(`SDK Relay Ready`));
        return { name: `SDK Relay Ready`, assertions: 1 };
      })
      .catch((error) => {
        log(red('Error encountered when resetting SDK Relay:', error));
        return { name: `SDK Relay Ready`, errors: [error.message] };
      })) as TestCase;

    testCaseResults.push(sdkReady);

    if (sdkReady.errors && sdkReady.errors.length > 0) {
      // Early return.
      return suite;
    }
    log(`Loading test files for scenario, ${scenarioName}`);

    const testCaseDir = path.join(this.config.testDataPath, scenario.testCases);

    const testCases = fs.readdirSync(testCaseDir);
    if (testCases.length === 0) {
      testCaseResults.push({ name: testCaseDir, errors: [{ message: 'No test case files found' }] });
    }

    for (const child of testCases) {
      const filePath = path.join(testCaseDir, child);

      // Skip dynamic typing files if not supported
      if (!sdkRelay.getSDKDetails().supportsDynamicTyping && isDynamicTypingFile(filePath)) {
        logIndent(1, yellow('skipped') + ` ${child} SDK does not support dynamic typing`);
        const testCaseResult: TestCase = { name: child, classname: child, skipped: true };
        testCaseResults.push(testCaseResult);
        continue;
      }

      // Skip directories.
      if (!fs.statSync(filePath).isFile()) {
        continue;
      }

      // Process the file here
      log(`Processing file: ${filePath}`);
      const testCase = fs.readFileSync(filePath, 'utf-8');

      const testCaseObj = JSON.parse(testCase);

      const flag = testCaseObj['flag'];
      const defaultValue = testCaseObj['defaultValue'];

      // Flag testing!!
      const isFlagTest = testCaseObj['variationType'];

      // Skip bandit tests if not supported
      if (!isFlagTest && !sdkRelay.getSDKDetails().supportsBandits) {
        logIndent(1, yellow('skipped') + ' SDK does not support Bandits');
        const testCaseResult: TestCase = { name: child, classname: child, skipped: true };
        testCaseResults.push(testCaseResult);
        continue;
      }

      if (testCaseObj['subjects'].length === 0) {
        testCaseResults.push({ name: testCase, errors: [{ message: 'No test subjects found' }] });
      }

      // Loop through the subjects and get their assignments.
      for (const subject of testCaseObj['subjects']) {
        const subjectKey = subject['subjectKey'];

        const testCaseLabel = `${flag}[${subjectKey}]`;

        // Prep a test case for the report
        const testCaseResult: TestCase = { name: `${testCaseLabel}`, classname: child };

        // Post the test case to the SDK relay and check the results.

        const result = isFlagTest
          ? sdkRelay.getAssignment({
              flag,
              subjectKey: subjectKey,
              assignmentType: testCaseObj['variationType'],
              defaultValue,
              subjectAttributes: subject['subjectAttributes'],
            } as AssignmentRequest)
          : sdkRelay.getBanditAction({
              flag,
              subjectKey: subjectKey,
              defaultValue,
              subjectAttributes: subject['subjectAttributes'],
              actions: subject['actions'],
            } as BanditActionRequest);

        await result
          .then((result: TestResponse) => {
            // Record the results as the "system out"
            testCaseResult.systemOut = JSON.stringify(result).split('\n');

            if (result.error) {
              testCaseResult.errors ??= [];
              testCaseResult.errors.push({
                message: result.error,
              });

              logIndent(1, red('fail') + ` ${testCaseLabel}: ${result.error}`);
            } else if (!App.isResultCorrect(result, subject)) {
              testCaseResult.failures ??= [];
              testCaseResult.failures.push({
                message: `Value ${JSON.stringify(result.result)} did not match expected ${JSON.stringify(subject.assignment)}`,
              });

              logIndent(1, red('fail') + ` ${testCaseLabel}:\n` + 
                `  Expected: ${JSON.stringify(subject.assignment, null, 2)}\n` +
                `  Received: ${JSON.stringify(result.result, null, 2)}`);
            } else {
              testCaseResult.assertions = 1;

              logIndent(1, green('pass') + ` ${testCaseLabel}`);
            }
          })
          .catch((error) => {
            if (error instanceof FeatureNotSupportedError) {
              // Skip this test
              logIndent(1, yellow('skipped') + ` ${testCaseLabel}: SDK does not support ${error.featureName}`);
              testCaseResult.skipped = true;
            } else {
              log(red('Error1:'), error);
              testCaseResult.errors ??= [];
              testCaseResult.errors.push({
                message: `Error encountered during test: ${error.message}`,
              });
            }
          });

        testCaseResults.push(testCaseResult);
      }
    }
    return suite;
  };

  private static isResultCorrect(results: TestResponse, subject: Record<string, object>): boolean {
    // Lodash's `isEqual` method is used here as a neat and tidy way to deep-compare arbitrary objects.
    return isEqual(subject['assignment'], results['result']);
  }
}
function isDynamicTypingFile(filePath: string) {
  return filePath.indexOf('dynamic-typing') >= 0;
}
