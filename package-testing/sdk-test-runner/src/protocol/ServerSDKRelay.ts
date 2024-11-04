import axios from 'axios';
import { AssignmentRequest } from '../dto/assignmentRequest';
import { BanditActionRequest } from '../dto/banditActionRequest';
import { TestResponse } from '../dto/testResponse';
import { SDKRelay } from './SDKRelay';
import { SDKInfo } from './SDKInfo';
import { SDKConnectionFailure } from './SDKConnectionFailure';
import { ASSIGNMENT_PATH, BANDIT_PATH, RESET_PATH } from './constants';

/**
 * Uses `axios` to communicate with a Server SDK Relay via http
 */

export class ServerSDKRelay implements SDKRelay {
  private sdkRelayAddress: string;
  private readonly sdkInfo: SDKInfo;

  constructor(serverAddress: string, sdkName: string) {
    this.sdkRelayAddress = serverAddress;

    // All servers support bandits.
    // In the future, we can have an endpoint for the SDK relays that specifies
    // more sdk info like version and future capabilities.
    this.sdkInfo = { sdkName, supportsBandits: true };
  }

  close(): void {
    return; // nothing to do.
  }

  async reset(): Promise<void> {
    const result = await axios.post(`${this.sdkRelayAddress}${RESET_PATH}`, {});
    if (result.status != 200) {
      throw new Error(`API Server returned unexpected status: ${result.status}`);
    }
  }

  async getBanditAction(request: BanditActionRequest): Promise<TestResponse> {
    const result = await axios.post(`${this.sdkRelayAddress}${BANDIT_PATH}`, request);
    return result.data as TestResponse;
  }

  isReady(): Promise<SDKInfo | SDKConnectionFailure> {
    return Promise.resolve(this.sdkInfo);
  }

  async getAssignment(request: AssignmentRequest): Promise<TestResponse> {
    return axios.post(`${this.sdkRelayAddress}${ASSIGNMENT_PATH}`, request).then((result) => {
      return result.data as TestResponse;
    });
  }
}
