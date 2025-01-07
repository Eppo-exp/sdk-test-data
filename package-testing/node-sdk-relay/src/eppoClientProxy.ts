import { AssignmentDto, BanditDto } from './types';
import { EppoClient } from '@eppo/js-client-sdk-common';
import getLogger from './main';

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

  private castAssignmentResult(result, assignmentType: AssignmentTypes) {
    switch (assignmentType) {
      case AssignmentTypes.INTEGER_ASSIGNMENT_TYPE:
        return parseInt(result, 10);
      case AssignmentTypes.STRING_ASSIGNMENT_TYPE:
        return result;
      case AssignmentTypes.BOOLEAN_ASSIGNMENT_TYPE:
        return Boolean(result);
      case AssignmentTypes.NUMERIC_ASSIGNMENT_TYPE:
        return Number(result);
      case AssignmentTypes.JSON_ASSIGNMENT_TYPE:
        return Object(result);
    }
  }

  getAssignment(eppoClientInstance: EppoClient, assignmentRequestBody: AssignmentDto) {
    const method = this.assignmentTypeToMethod.get(assignmentRequestBody.assignmentType);

    let result: AssignmentResult = eppoClientInstance[method](
      assignmentRequestBody.flag,
      assignmentRequestBody.subjectKey,
      assignmentRequestBody.subjectAttributes,
      assignmentRequestBody.defaultValue,
    );
    result = this.castAssignmentResult(result, assignmentRequestBody.assignmentType);

    return {
      subjectKey: assignmentRequestBody.subjectKey,
      result: result,
      request: assignmentRequestBody,
      assignmentLog: getLogger(),
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
      banditLog: getLogger(),
    };
  }
}
