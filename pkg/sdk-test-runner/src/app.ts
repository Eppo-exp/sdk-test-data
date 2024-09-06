import axios from 'axios';
import config from './config';
import * as fs from 'fs';
import path from 'path';
import { green, red, yellow } from './logging';


console.log(config.logPrefix + `Firing up test runner for ${config.sdkName}`);
console.log(config.logPrefix + `Posting test cases to SDK server at ${config.sdkServer}`);
console.log(config.logPrefix + `Controlling configuration server at ${config.apiServer}`);

const testConfig = JSON.parse(fs.readFileSync(config.scenarioFile, 'utf-8'));

const scenarios = testConfig['scenarios'];

const failures: Record<string, any>[] = [];
let numTestCases = 0;
// failures.push({error: "I'm a fake failure"});

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

            // Determine whether case is a flag assignment or bandit selection

            // Flag testing!!
            if (!!testCaseObj['variationType']) {

                // Loop through the subjects and get their assignments.

                for (let subject of testCaseObj['subjects']) {
                    const flagKey = testCaseObj['flag'];
                    const variationType = testCaseObj['variationType'];
                    const defaultValue = testCaseObj['defaultValue'];
                    const subjectKey = subject['subjectKey'];
                    const payload = {
                        flag: flagKey,
                        variationType: variationType,
                        defaultValue: defaultValue,
                        subjectKey: subjectKey,
                        subjectAttributes: subject['subjectAttributes']
                    };

                    numTestCases++;

                    // Post the test case to the SDK relay 

                    const results = await axios.post(`${config.sdkServer}/flags/v1/assignment`, payload).then(
                        result => {
                            return result.data;
                        }
                    ).catch(error => {
                        console.error('Error:', error);
                        failures.push({ error });
                    });

                    const passed = isResultCorrect(results, subject);

                    if (!passed) {
                        failures.push(results);
                    }

                    console.log(config.logPrefix + (passed ? green("pass") : red("fail")) + ` ${flagKey}[${subjectKey}] `);
                }
            }
        }
    }
}

(async () => {
    for (const scenario of Object.keys(scenarios)) {
        await testScenario(scenario);
    }
})().then(() => {

    const passes = numTestCases - failures.length;
    console.log(config.logPrefix + yellow("*** Test Results *** "));
    console.log(config.logPrefix + green(`${passes}/${numTestCases} passed`));
    console.log(config.logPrefix + red(`${failures.length} failures`));
    if (failures.length) {
        console.log(config.logPrefix + red("Failure Details"));
    }
    console.log(failures);

    // Print results summary

    // Exit 1 if there were test failures
    if (failures.length > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}
);

function isResultCorrect(results: any, subject: any): boolean {
    if (subject['assignment'] == results['assignment'] || subject['assignment'] == results['result']) {
        return true;
    }
    return false;
}
