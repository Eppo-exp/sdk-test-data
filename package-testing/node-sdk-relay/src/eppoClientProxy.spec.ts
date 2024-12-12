import { EppoClientProxy } from './eppoClientProxy';
import { EppoClient } from '@eppo/js-client-sdk-common';
import SpyInstance = jest.SpyInstance;

describe('EppoClientProxy', () => {
  const validAssignmentMethods = new Map([
    ['INTEGER', `getIntegerAssignment`],
    ['STRING', 'getStringAssignment'],
    ['BOOLEAN', 'getBooleanAssignment'],
    ['NUMERIC', 'getNumericAssignment'],
    ['JSON', 'getJSONAssignment'],
  ]);
  const proxyClient = new EppoClientProxy();
  const client = new EppoClient({
    flagConfigurationStore: null,
  });
  const mockAssignmentPayload = {
    flag: 'integer-flag',
    assignmentType: 'INTEGER',
    defaultValue: '0',
    subjectKey: 'alice',
    subjectAttributes: { email: 'alice@mycompany.com', country: 'US' },
  };

  it('Correct assignment method are called based assignment type', () => {
    let assignmentMethodSpy: SpyInstance;

    validAssignmentMethods.forEach((assignmentType: string, method: string) => {
      mockAssignmentPayload.assignmentType = method;
      assignmentMethodSpy = jest.spyOn(client, assignmentType as never);

      proxyClient.getAssignment(client, mockAssignmentPayload);
      expect(assignmentMethodSpy).toHaveBeenCalledTimes(1);
      assignmentMethodSpy.mockReset();
    });
  });
});
