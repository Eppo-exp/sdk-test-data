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
import { SDKRelay, ServerSDKRelay } from './protocol';

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
    log(`Controlling configuration server at ${this.apiServer}`);
  }

  public async run() {
    this.printHeader();
    log(`Posting test cases to SDK server at ${this.sdkServer}`);

    const testConfig = JSON.parse(fs.readFileSync(path.join(this.testDataPath, this.scenarioFile), 'utf-8'));
    const scenarios = testConfig['scenarios'] as Scenarios;

    if (Object.keys(scenarios).length == 0) {
      log(red('Error: empty scenario list'));
      return 1;
    }

    const sdkRelay = new ServerSDKRelay(this.sdkServer);
    if (!(await sdkRelay.isReady())) {
      log(red('Error: SDK Relay is not ready'));
      return 1;
    }

    const testSuiteResults: TestSuite[] = await this.runTestScenarios(scenarios, sdkRelay);

    const numTestCases = testSuiteResults.reduce((prev, cur) => prev + cur.testCases.length, 0);

    const numFailures = testSuiteResults.reduce(
      (prev, cur) => cur.testCases.filter((testCase) => testCase?.errors || testCase?.failures).length + prev,
      0,
    );

    const passes = numTestCases - numFailures;

    log('*** Test Results *** ');
    log(green(`${passes}/${numTestCases} passed`));

    const failureFunc = numFailures > 0 ? red : green;
    log(failureFunc(`${numFailures} failures`));

    // Junit support.
    if (this.junitFile) {
      this.writeJUnitReport(testSuiteResults, 'A report name', this.junitFile);
    }

    // Exit 1 if there were test failures
    if (numFailures > 0) {
      process.exit(1);
    }
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
    fs.writeFileSync(junitFile, junitXml);

    log(green(`Test results written to ${junitFile}`));
  }

  private testScenario = async (scenarioName: string, scenario: Scenario, sdkRelay: SDKRelay): Promise<TestSuite> => {
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
    if (testCases.length == 0) {
      testCaseResults.push({ name: testCaseDir, errors: [{ message: 'No test case files found' }] });
    }

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

      if (testCaseObj['subjects'].length == 0) {
        testCaseResults.push({ name: testCase, errors: [{ message: 'No test subjects found' }] });
      }

      // Loop through the subjects and get their assignments.
      for (const subject of testCaseObj['subjects']) {
        const subjectKey = subject['subjectKey'];
        // Prep a test case for the report
        const testCaseResult: TestCase = { name: `${flag}[${subjectKey}]`, classname: child };

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
            const passed = App.isResultCorrect(result, subject);

            // Record the results as the "system out"
            testCaseResult.systemOut = JSON.stringify(result).split('\n');

            if (!passed) {
              testCaseResult.failures ??= [];
              testCaseResult.failures.push({
                message: `Value ${result.result} did not match expected ${subject.assignment}`,
              });

              logIndent(1, red('fail') + ` ${flag}[${subjectKey}]: ${result.result} != ${subject.assignment}`);
            } else {
              testCaseResult.assertions = 1;

              logIndent(1, green('pass') + ` ${flag}[${subjectKey}]`);
            }
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
    return isEqual(subject['assignment'], results['result']);
  }
}
