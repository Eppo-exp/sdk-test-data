import axios from 'axios';
import config from './config';
import * as fs from 'fs';
import path from 'path';
import { green, log, logIndent, red, yellow } from './logging';
import { AssignmentRequest } from './dto/assignmentRequest';
import { first, isEqual } from 'lodash';
import { BanditActionRequest } from './dto/banditActionRequest';
import { sleep } from './util';
import { TestResponse } from './dto/testResponse';

log(`Firing up test runner for ${config.sdkName}`);
log(`Posting test cases to SDK server at ${config.sdkServer}`);
log(`Controlling configuration server at ${config.apiServer}`);

const testConfig = JSON.parse(fs.readFileSync(path.join(config.testDataPath, config.scenarioFile), 'utf-8'));

const scenarios = testConfig['scenarios'];

const failures: TestResponse[] = [];
let numTestCases = 0;
// failures.push({error: "I'm a fake failure"});

let firstTestCase = true;
const testScenario = async (key: string) => {

    const safeSdkName = encodeURIComponent(config.sdkName);

    await axios
        .post(`${config.apiServer}/sdk/${safeSdkName}/scenario`, { label: key })
        .then((result) => {
            if (result.status != 200) {
                log(yellow(`API server returned an error when setting test scenario`));
                console.log(result);
                // STOP
            }
            log(`Set Testing Scenario to ${key}`);
        })
        .catch((error) => {
            console.error('Error:', error);
            // STOP
        });

    if (!firstTestCase) {
        log('Sleeping between scenarios so SDK can reload cache');
        // TODO: make this configurable for SDKs which can control the cache TTL
        await sleep(31000);
    } else {
        firstTestCase = false;
    }

    log(`Loading test files for scenario, ${key}`);

    const testCaseDir = path.join(config.testDataPath, scenarios[key]['testCases']);
    console.log(`Scanning ${testCaseDir}`);
    console.log()
    const testCases = fs.readdirSync(testCaseDir);
    for (const testCase of testCases) {
        const filePath = path.join(testCaseDir, testCase);

        // Check if the item is a file
        if (fs.statSync(filePath).isFile()) {
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

                numTestCases++;

                const payload = isFlagTest
                    ? {
                        flag,
                        subjectKey: subject['subjectKey'],
                        variationType: testCaseObj['variationType'],
                        defaultValue,
                        subjectAttributes: subject['subjectAttributes']
                    } as AssignmentRequest :
                    {
                        flag,
                        subjectKey: subject['subjectKey'],
                        defaultValue,
                        subjectAttributes: subject['subjectAttributes'],
                        actions: subject['actions']
                    } as BanditActionRequest;

                // Post the test case to the SDK relay and check the results.
                await axios
                    .post(`${config.sdkServer}${requestPath}`, payload)
                    .then((result) => {
                        const results = result.data as TestResponse;

                        const passed = isResultCorrect(results, subject);

                        if (!passed) {
                            failures.push(results);
                        }

                        logIndent(1, (passed ? green('pass') : red('fail')) + ` ${flag}[${payload.subjectKey}] `);
                    })
                    .catch((error) => {
                        log(red('Error:'), error);
                        failures.push({ error });
                    });

    
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

function isResultCorrect(results: TestResponse, subject: any): boolean {
    // Lodash's `isEqual` method is used here as a neat and tidy way to deep-compare arbitrary objects.
    if (isEqual(subject['assignment'], results['result'])) {
        return true;
    }
    return false;
}
