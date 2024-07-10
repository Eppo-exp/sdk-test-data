import * as fs from 'fs';
import { IAssignmentTestCase } from './types';

const getTestFilePaths = () => {
  const testDir = './ufc/tests';
  return fs.readdirSync(testDir).map((testFilename) => `${testDir}/${testFilename}`);
}

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

describe('UFC Test Validation', () => {
  describe.each(getTestFilePaths())('for file: %s', (testFilePath: string) => {
    const testCase = parseJSON(testFilePath);
    describe.each(testCase.subjects.map(({subjectKey}) => subjectKey))('with subjectKey %s', (subjectKey) => {
      const subject = testCase.subjects.find((subject) => subject.subjectKey === subjectKey)!;

      if (subject.evaluationDetails.variationValue === null) {
        it('should have `assignment` match `defaultValue` when `evaluationDetails.variationValue` is null', () => {
          expect(subject.assignment).toEqual(testCase.defaultValue);
        })
      }

      if (subject.evaluationDetails.variationValue !== null) {
        it('should have `assignment` match `evaluationDetails.variationValue` when `evaluationDetails.variationValue` is not null', () => {
          expect(subject.assignment).toEqual(subject.evaluationDetails.variationValue);
        })
      }
    });
  })
});
