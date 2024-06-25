import * as fs from 'fs';
import { IAssignmentTestCase } from './types';


const parseJSON = (testFilePath: string) => {
  try {
    const fileContents = fs.readFileSync(testFilePath, 'utf-8');
    const parsedJSON = JSON.parse(fileContents);
    return parsedJSON as IAssignmentTestCase;
  } catch (err) {
    console.error(`failed to parse JSON in ${testFilePath}`)
    console.error(err);
    process.exit(1);
  }
}

const validateAssignmentDetails = (testFilePath: string, testCase: IAssignmentTestCase) => {
  const errors: string[] = [];
  testCase.subjects.forEach(({ subjectKey, assignment, assignmentDetails }) => {
    const addError = (message: string) => {
      errors.push(`Error (subjectKey "${subjectKey}"): ${message}`);
    }
    // stringify for deep equality checks with objects
    const stringifiedDefaultValue = JSON.stringify(testCase.defaultValue);
    const stringifiedAssignment = JSON.stringify(assignment);
    const stringifiedDetailsValue = JSON.stringify(assignmentDetails.value);
    const stringifiedDetailsVariationValue = JSON.stringify(assignmentDetails.variationValue);

    if (stringifiedAssignment !== stringifiedDetailsValue) {
      addError('assignment must always match assignmentDetails.value');
    }
    if (assignmentDetails.variationValue === null && stringifiedAssignment !== stringifiedDefaultValue) {
      addError('assignment must match defaultValue when assignmentDetails.variationValue is null');
    }
    if (assignmentDetails.variationValue !== null && stringifiedAssignment !== stringifiedDetailsVariationValue) {
      addError('assignment must match assignmentDetails.variationValue when assignmentDetails.variationValue is not null')
    }
  });
  if (errors.length) {
    console.error(`\nError(s) encountered validating ${testFilePath}:\n`)
    errors.forEach((error) => {
      console.error(`- ${error}`)
    });
    console.error('');
    process.exit(1);
  }
}

const run = () => {
  const testDir = './ufc/tests';
  fs.readdirSync(testDir).forEach((testFilename) => {
    const testFilePath = `${testDir}/${testFilename}`
    const testCase = parseJSON(testFilePath);
    validateAssignmentDetails(testFilePath, testCase);
  });
  console.log(`Validation passed for ${testDir}`);
}

run();