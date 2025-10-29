import * as fs from 'fs';
import { IAssignmentTestCase } from './types';

const getTestFilePaths = () => {
  const testDirs = ['./ufc/tests'];

  // Also include generated tests if directory exists
  const generatedTestDir = './ufc/generated-tests';
  if (fs.existsSync(generatedTestDir)) {
    testDirs.push(generatedTestDir);
  }


  const allFilePaths: string[] = [];

  testDirs.forEach(testDir => {
    const filenames = fs.readdirSync(testDir).filter(filename => filename.endsWith('.json'));
    const filePaths = filenames.map(filename => `${testDir}/${filename}`);
    allFilePaths.push(...filePaths);
  });

  return allFilePaths;
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

      if (subject.evaluationDetails.flagEvaluationCode === "MATCH") {
        it('should have `assignment` match `evaluationDetails.variationValue` when `evaluationDetails.flagEvaluationCode` is "MATCH"', () => {
          expect(subject.assignment).toEqual(subject.evaluationDetails.variationValue);
        });
      } else {
        it('should have `assignment` match `defaultValue` when `evaluationDetails.flagEvaluationCode` is not "MATCH"', () => {
          expect(subject.assignment).toEqual(testCase.defaultValue);
        });
      }
    });
  })
});
