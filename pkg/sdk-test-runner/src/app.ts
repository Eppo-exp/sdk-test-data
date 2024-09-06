import axios from 'axios';
import config from './config';
import * as fs from 'fs';
import path from 'path';

console.log(config.logPrefix + `Firing up test runner for ${config.sdkName}`);
console.log(config.logPrefix + `Posting test cases to SDK server at ${config.sdkServer}`);
console.log(config.logPrefix + `Controlling configuration server at ${config.apiServer}`);

const testConfig = JSON.parse(fs.readFileSync(config.scenarioFile, 'utf-8'));

const scenarios = testConfig['scenarios'];

const failutes = [];
const testCases = 0;

const testScenario = async (key: string) => {
    const safeSdkName = encodeURIComponent(config.sdkName);

    await axios.post(`${config.apiServer}/sdk/${safeSdkName}/scenario`, { label: key })
        .then(_ => {
            console.log(config.logPrefix + `Set Testing Scenario to ${key}`);
        })
        .catch(error => {
            console.error('Error:', error);
        });


    console.log(config.logPrefix + `Loading test files for scenario, ${key}`);

    const testCaseDir = path.join(config.testDataPath, scenarios[key]['testCases']);
    const testCases = fs.readdirSync(testCaseDir);
    for (const testCase of testCases) {
        const filePath = `${testCaseDir}/${testCase}`;

        // Check if the item is a file
        if (fs.statSync(filePath).isFile()) {
            // Process the file here
            console.log(`${config.logPrefix}Processing file: ${filePath}`);
            const testCase = fs.readFileSync(filePath, "utf-8");

            const testCaseObj = JSON.parse(testCase);
            // Prep the expected answers
            const assignments = Object.keys(testCaseObj['subjects']).map(subject => {
                return testCaseObj['subjects'][subject]['assignment'];
            });

            // Post the test case to the SDK relay server

            // Compare the results.

            // console.log(testCaseObj);
            // console.log(assignments);
        }
        break;
    }
};

(async () => {
    for (const scenario of Object.keys(scenarios)) {
        await testScenario(scenario);
    }
})().then(() => {
    
    // Print results summary

    // Exit 1 if there were test failures
    if (failutes.length > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}
);