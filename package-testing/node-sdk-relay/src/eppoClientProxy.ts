import { AssignmentDto, BanditDto } from './types';
import { EppoClient } from '@eppo/js-client-sdk-common';

export enum AssignmentTypes {
  INTEGER_ASSIGNMENT_TYPE = 'INTEGER',
  STRING_ASSIGNMENT_TYPE = 'STRING',
  BOOLEAN_ASSIGNMENT_TYPE = 'BOOLEAN',
  NUMERIC_ASSIGNMENT_TYPE = 'NUMERIC',
  JSON_ASSIGNMENT_TYPE = 'JSON',
}

type AssignmentResult = number | string | object | boolean;

export class EppoClientProxy {
  private readonly assignmentTypeToMethod = new Map([
    [AssignmentTypes.INTEGER_ASSIGNMENT_TYPE, 'getIntegerAssignment'],
    [AssignmentTypes.STRING_ASSIGNMENT_TYPE, 'getStringAssignment'],
    [AssignmentTypes.BOOLEAN_ASSIGNMENT_TYPE, 'getBooleanAssignment'],
    [AssignmentTypes.NUMERIC_ASSIGNMENT_TYPE, 'getNumericAssignment'],
    [AssignmentTypes.JSON_ASSIGNMENT_TYPE, 'getJSONAssignment'],
  ]);

  getAssignment(eppoClientInstance: EppoClient, assignmentRequestBody: AssignmentDto) {
    const method = this.assignmentTypeToMethod.get(assignmentRequestBody.assignmentType);

    const result: AssignmentResult = eppoClientInstance[method](
      assignmentRequestBody.flag,
      assignmentRequestBody.subjectKey,
      assignmentRequestBody.subjectAttributes,
      assignmentRequestBody.defaultValue,
    );

    return {
      subjectKey: assignmentRequestBody.subjectKey,
      result: result,
      request: assignmentRequestBody
    };
  }

  getBanditAction(eppoClientInstance: EppoClient, banditRequestBody: BanditDto) {
    const result = eppoClientInstance.getBanditAction(
      banditRequestBody.flag,
      banditRequestBody.subjectKey,
      banditRequestBody.subjectAttributes,
      banditRequestBody.actions,
      banditRequestBody.defaultValue,
    );

    return {
      subjectKey: banditRequestBody.subjectKey,
      result: result,
      request: banditRequestBody,
    };
  }
}
