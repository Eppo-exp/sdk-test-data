import axios from 'axios';
import config from './config';
import * as fs from 'fs';
import path from 'path';
import { green, log, red, yellow } from './logging';
import { Assignment } from './dto/assignmnent';

log(`Firing up test runner for ${config.sdkName}`);
log(`Posting test cases to SDK server at ${config.sdkServer}`);
log(`Controlling configuration server at ${config.apiServer}`);

const testConfig = JSON.parse(fs.readFileSync(config.scenarioFile, 'utf-8'));

const scenarios = testConfig['scenarios'];

const failures: Record<string, object>[] = [];
let numTestCases = 0;
// failures.push({error: "I'm a fake failure"});

const testScenario = async (key: string) => {
  const safeSdkName = encodeURIComponent(config.sdkName);

  await axios
    .post(`${config.apiServer}/sdk/${safeSdkName}/scenario`, { label: key })
    .then((result) => {
        if (result.status != 200) {
            log(yellow(`API server returned an error when setting test scenario`));
            console.log(result);
        }
      log(`Set Testing Scenario to ${key}`);
    })
    .catch((error) => {
      console.error('Error:', error);
      // STOP
    });

  log(`Loading test files for scenario, ${key}`);

  const testCaseDir = path.join(config.testDataPath, scenarios[key]['testCases']);
  const testCases = fs.readdirSync(testCaseDir);
  for (const testCase of testCases) {
    const filePath = `${testCaseDir}/${testCase}`;

    // Check if the item is a file
    if (fs.statSync(filePath).isFile()) {
      // Process the file here
      log(`Processing file: ${filePath}`);
      const testCase = fs.readFileSync(filePath, 'utf-8');

      const testCaseObj = JSON.parse(testCase);

      // Determine whether case is a flag assignment or bandit selection

      // Flag testing!!
      if (testCaseObj['variationType']) {
        // Loop through the subjects and get their assignments.
        const flagKey = testCaseObj['flag'];
        const variationType = testCaseObj['variationType'];
        const defaultValue = testCaseObj['defaultValue'];

        for (const subject of testCaseObj['subjects']) {
          const payload: Assignment = new Assignment(
            flagKey,
            subject['subjectKey'],
            variationType,
            defaultValue,
            subject['subjectAttributes'],
          );

          numTestCases++;

          // Post the test case to the SDK relay

          const results = await axios
            .post(`${config.sdkServer}/flags/v1/assignment`, payload)
            .then((result) => {
              return result.data;
            })
            .catch((error) => {
              log(red('Error:'), error);
              failures.push({ error });
            });

          const passed = isResultCorrect(results, subject);

          if (!passed) {
            failures.push(results);
          }

          log((passed ? green('pass') : red('fail')) + ` ${flagKey}[${payload.subjectKey}] `);
        }
      }
    }
  }
};

(async () => {
  for (const scenario of Object.keys(scenarios)) {
    await testScenario(scenario);
  }
})().then(() => {
  const passes = numTestCases - failures.length;
  log(yellow('*** Test Results *** '));
  log(green(`${passes}/${numTestCases} passed`));
  log(red(`${failures.length} failures`));
  if (failures.length) {
    log(red('Failure Details'), failures);
  }
  // Print results summary

  // Exit 1 if there were test failures
  if (failures.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});

function isResultCorrect(results: any, subject: any): boolean {
  if (subject['assignment'] == results['assignment'] || subject['assignment'] == results['result']) {
    return true;
  }
  return false;
}
