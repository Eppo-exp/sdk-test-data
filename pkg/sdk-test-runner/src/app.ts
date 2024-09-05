import axios from 'axios';
import config from './config';
import * as fs from 'fs';

console.log(config.logPrefix + `Firing up test runner for ${config.sdkName}`);
console.log(config.logPrefix + `Posting test cases to SDK server at ${config.sdkServer}`);
console.log(config.logPrefix + `Controlling configuration server at ${config.apiServer}`);

const testConfig = JSON.parse(fs.readFileSync(config.scenarioFile, 'utf-8'));

const scenarios = testConfig['scenarios'];

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

    const testCaseDir = scenarios[key]['testCases'];
    const testCases = fs.readdirSync(testCaseDir);
    for (const testCase of testCases) {
        const filePath = `${testCaseDir}/${testCase}`;

        // Check if the item is a file
        if (fs.statSync(filePath).isFile()) {
            // Process the file here
            console.log(`${config.logPrefix}Processing file: ${filePath}`);
            const testCase = fs.readFileSync(filePath, "utf-8");
            console.log(testCase);
        }
    }

};

Object.keys(scenarios).forEach(testScenario);