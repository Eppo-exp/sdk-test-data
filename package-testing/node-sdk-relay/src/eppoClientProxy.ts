import { AssignmentDto } from './types';
import { EppoClient } from '@eppo/js-client-sdk-common';
import getLogger from './main';

export class EppoClientProxy {
  private readonly assignmentTypeToMethod = new Map([
    ['INTEGER', 'getIntegerAssignment'],
    ['STRING', 'getStringAssignment'],
    ['BOOLEAN', 'getBooleanAssignment'],
    ['NUMERIC', 'getNumericAssignment'],
    ['JSON', 'getJSONAssignment'],
  ]);

  getAssignment(eppoClientInstance: EppoClient, assignmentRequestBody: AssignmentDto) {
    const method = this.assignmentTypeToMethod.get(assignmentRequestBody.assignmentType);

    const result = eppoClientInstance[method](
      assignmentRequestBody.flag,
      assignmentRequestBody.subjectKey,
      assignmentRequestBody.subjectAttributes,
      assignmentRequestBody.defaultValue,
    );

    return {
      subjectKey: assignmentRequestBody.subjectKey,
      result,
      request: assignmentRequestBody,
      assignmentLog: getLogger(),
    };
  }
}
