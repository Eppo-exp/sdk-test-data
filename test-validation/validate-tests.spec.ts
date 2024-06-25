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

      it('should have matching `assignment` and `assignmentDetails.value` values', () => {
        expect(subject.assignment).toEqual(subject.assignmentDetails.value);
      });

      if (subject.assignmentDetails.variationValue === null) {
        it('should have `assignmentDetails.value` match `defaultValue` when `assignmentDetails.variationValue` is null', () => {
          expect(subject.assignmentDetails.value).toEqual(testCase.defaultValue);
        })
      }

      if (subject.assignmentDetails.variationValue !== null) {
        it('should have `assignmentDetails.value` match `assignmentDetails.variationValue` when `assignmentDetails.variationValue` is not null', () => {
          expect(subject.assignmentDetails.value).toEqual(subject.assignmentDetails.variationValue);
        })
      }
    });
  })
});
