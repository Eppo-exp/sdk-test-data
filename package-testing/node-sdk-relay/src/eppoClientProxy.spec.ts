import { AssignmentTypes, EppoClientProxy } from './eppoClientProxy';
import { EppoClient } from '@eppo/js-client-sdk-common';
import SpyInstance = jest.SpyInstance;

describe('EppoClientProxy', () => {
  const validAssignmentMethods = new Map([
    [AssignmentTypes.INTEGER_ASSIGNMENT_TYPE, 'getIntegerAssignment'],
    [AssignmentTypes.STRING_ASSIGNMENT_TYPE, 'getStringAssignment'],
    [AssignmentTypes.BOOLEAN_ASSIGNMENT_TYPE, 'getBooleanAssignment'],
    [AssignmentTypes.NUMERIC_ASSIGNMENT_TYPE, 'getNumericAssignment'],
    [AssignmentTypes.JSON_ASSIGNMENT_TYPE, 'getJSONAssignment'],
  ]);
  const proxyClient = new EppoClientProxy();
  const client = new EppoClient({
    flagConfigurationStore: null,
  });
  const mockAssignmentPayload = {
    flag: 'integer-flag',
    assignmentType: AssignmentTypes.INTEGER_ASSIGNMENT_TYPE,
    defaultValue: '0',
    subjectKey: 'alice',
    subjectAttributes: { email: 'alice@mycompany.com', country: 'US' },
  };

  it('Correct assignment method are called based assignment type', () => {
    let assignmentMethodSpy: SpyInstance;

    validAssignmentMethods.forEach((method: string, assignmentType: AssignmentTypes) => {
      mockAssignmentPayload.assignmentType = assignmentType;
      assignmentMethodSpy = jest.spyOn(client, method as never);

      proxyClient.getAssignment(client, mockAssignmentPayload);
      expect(assignmentMethodSpy).toHaveBeenCalledTimes(1);
      assignmentMethodSpy.mockReset();
    });
  });
});
