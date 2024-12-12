import { EppoClientProxy } from './eppoClientProxy';
import EppoClient from '@eppo/js-client-sdk-common/src/client/eppo-client';

describe('EppoClientProxy', () => {
  const validAssignmentMethods = new Map([
    ['INTEGER', `getIntegerAssignment`],
    ['STRING', 'getStringAssignment'],
    ['BOOLEAN', 'getBooleanAssignment'],
    ['NUMERIC', 'getNumericAssignment'],
    ['JSON', 'getJSONAssignment'],
  ]);
  const proxyClient = new EppoClientProxy();

  it('Correct assignment method are called based assignment type', () => {
    const eppoClientspy = jest.spyOn(EppoClient, 'getIntegerAssignment');

    const mockAlice = {
      flag: 'integer-flag',
      assignmentType: 'INTEGER',
      defaultValue: '0',
      subjectKey: 'alice',
      subjectAttributes: { email: 'alice@mycompany.com', country: 'US' },
    };
    proxyClient.getAssignment(mockAlice);
  });
});
