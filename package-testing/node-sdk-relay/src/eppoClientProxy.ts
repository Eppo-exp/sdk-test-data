import { AssignmentDto } from './types';
import { EppoClient } from '@eppo/js-client-sdk-common';

export class EppoClientProxy {
  private readonly assignmentTypeToMethod = new Map([
    ['INTEGER', `getIntegerAssignment`],
    ['STRING', 'getStringAssignment'],
    ['BOOLEAN', 'getBooleanAssignment'],
    ['NUMERIC', 'getNumericAssignment'],
    ['JSON', 'getJSONAssignment'],
  ]);

  getAssignment(eppoClientInstance: EppoClient, assignmentRequestBody: AssignmentDto) {
    const method = this.assignmentTypeToMethod.get(assignmentRequestBody.assignmentType);

    return eppoClientInstance[method](
      assignmentRequestBody.flag,
      assignmentRequestBody.subjectKey,
      assignmentRequestBody.subjectAttributes,
      assignmentRequestBody.defaultValue,
    );
  }
}
