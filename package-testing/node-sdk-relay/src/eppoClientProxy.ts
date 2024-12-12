import { getInstance } from '@eppo/node-server-sdk';
import { AssignmentDto } from './types';

export class EppoClientProxy {
  private readonly assignmentTypeToMethod = new Map([
    ['INTEGER', `getIntegerAssignment`],
    ['STRING', 'getStringAssignment'],
    ['BOOLEAN', 'getBooleanAssignment'],
    ['NUMERIC', 'getNumericAssignment'],
    ['JSON', 'getJSONAssignment'],
  ]);

  getAssignment(assignmentRequestBody: AssignmentDto) {
    const method = this.assignmentTypeToMethod.get(assignmentRequestBody.assignmentType);
    const eppoClientInstance = getInstance();

    return eppoClientInstance[method](
      assignmentRequestBody.flag,
      assignmentRequestBody.subjectKey,
      assignmentRequestBody.subjectAttributes,
      assignmentRequestBody.defaultValue,
    );
  }
}
