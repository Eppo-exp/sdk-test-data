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

export default class App {
  public constructor(
    private readonly sdkName: string,
    private readonly sdkServer: string,
    private readonly apiServer: string,
    private readonly testDataPath: string,
    private readonly scenarioFile: string,
    private readonly junitFile: string,
  ) {}

  private printHeader(): void {
    log(`Firing up test runner for ${this.sdkName}`);
    log(`Posting test cases to SDK server at ${this.sdkServer}`);
    log(`Controlling configuration server at ${this.apiServer}`);
  }

  public async run() {
    this.printHeader();

    const testConfig = JSON.parse(fs.readFileSync(path.join(this.testDataPath, this.scenarioFile), 'utf-8'));
    const scenarios = testConfig['scenarios'] as Scenarios;

    if (Object.keys(scenarios).length == 0) {
      log(red('Error: empty scenario list'));
      return 1;
    }

    const testSuiteResults: TestSuite[] = await this.runTestScenarios(scenarios);

    // const passes = testSuiteResults.some((testSuite) =>
    //   testSuite.testCases.some((testCase) => testCase?.errors || testCase?.failures),
    // );
    const numTestCases = testSuiteResults.reduce((prev, cur) => prev + cur.testCases.length, 0);

    const numFailures = testSuiteResults.reduce(
      (prev, cur) => cur.testCases.filter((testCase) => testCase?.errors || testCase?.failures).length,
      0,
    );

    const passes = numTestCases - numFailures;

    log(yellow('*** Test Results *** '));
    log(green(`${passes}/${numTestCases} passed`));
    log(red(`${numFailures} failures`));

    // Junit support.
    if (this.junitFile) {
      this.writeJUnitReport(testSuiteResults, 'A report name', this.junitFile);
    }

    // Return 1 if there are any failures or errors
    // const hasFailed = testSuiteResults.suites

    // Exit 1 if there were test failures
    if (numFailures > 0) {
      return 1;
    } else {
      return 0;
    }
  }

  async runTestScenarios(scenarios: Scenarios): Promise<TestSuite[]> {
    const suites: TestSuite[] = [];

    for (const scenarioName of Object.keys(scenarios)) {
      suites.push(await this.testScenario(scenarioName, scenarios[scenarioName]));
    }
    return suites;
  }

  writeJUnitReport(testSuites: TestSuite[], reportName: string, junitFile: string) {
    const testSuiteReport: TestSuiteReport = {
      name: reportName,
      suites: testSuites,
    };
    const junitXml = getJunitXml(testSuiteReport);
    // console.log(junitXml);
    fs.writeFileSync(junitFile, junitXml);

    log(green('JUnit file written successfully!'));
  }

  private testScenario = async (scenarioName: string, scenario: Scenario): Promise<TestSuite> => {
    const safeSdkName = encodeURIComponent(this.sdkName);
    const testCaseResults: TestCase[] = [];

    const suite: TestSuite = { name: scenarioName, timestamp: new Date(), testCases: testCaseResults };

    const scenarioSet = (await axios
      .post(`${this.apiServer}/sdk/${safeSdkName}/scenario`, { label: scenarioName })
      .then((result) => {
        if (result.status != 200) {
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
    const sdkReady = (await axios
      .post(`${this.sdkServer}/sdk/reset`, {})
      .then((result) => {
        if (result.status != 200) {
          throw new Error(`API Server returned unexpected status: ${result.status}`);
        } else {
          log(green(`SDK Relay Ready`));
          return { name: `SDK Relay Ready`, assertions: 1 };
        }
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

    const testCaseDir = path.join(this.testDataPath, scenario.testCases);

    const testCases = fs.readdirSync(testCaseDir);
    for (const child of testCases) {
      const filePath = path.join(testCaseDir, child);

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

      const requestPath = isFlagTest ? '/flags/v1/assignment' : '/bandits/v1/action';

      // Loop through the subjects and get their assignments.
      for (const subject of testCaseObj['subjects']) {
        const payload = isFlagTest
          ? ({
              flag,
              subjectKey: subject['subjectKey'],
              assignmentType: testCaseObj['variationType'],
              defaultValue,
              subjectAttributes: subject['subjectAttributes'],
            } as AssignmentRequest)
          : ({
              flag,
              subjectKey: subject['subjectKey'],
              defaultValue,
              subjectAttributes: subject['subjectAttributes'],
              actions: subject['actions'],
            } as BanditActionRequest);

        // Post the test case to the SDK relay and check the results.
        const testCaseResult: TestCase = { name: `${flag}[${payload.subjectKey}]`, classname: child };
        await axios
          .post(`${this.sdkServer}${requestPath}`, payload)
          .then((result) => {
            const results = result.data as TestResponse;

            const passed = App.isResultCorrect(results, subject);

            // Record the results as the "system out"
            testCaseResult.systemOut = JSON.stringify(result.data as string).split('\n');

            if (!passed) {
              testCaseResult.failures ??= [];
              testCaseResult.failures.push({
                message: `Value ${results.result} did not match expected ${subject.assignment}`,
              });
            } else {
              testCaseResult.assertions = 1;
            }

            logIndent(1, (passed ? green('pass') : red('fail')) + ` ${flag}[${payload.subjectKey}] `);
          })
          .catch((error) => {
            log(red('Error:'), error);
            testCaseResult.errors ??= [];
            testCaseResult.errors.push({
              message: `Error encountered during test: ${error.message}`,
            });
          });
        testCaseResults.push(testCaseResult);
      }
    }
    return suite;
  };

  private static isResultCorrect(results: TestResponse, subject: Record<string, object>): boolean {
    // Lodash's `isEqual` method is used here as a neat and tidy way to deep-compare arbitrary objects.
    if (isEqual(subject['assignment'], results['result'])) {
      return true;
    }
    return false;
  }
}
