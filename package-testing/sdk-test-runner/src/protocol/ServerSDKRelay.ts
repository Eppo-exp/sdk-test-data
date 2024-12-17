import axios from 'axios';
import { AssignmentRequest } from '../dto/assignmentRequest';
import { BanditActionRequest } from '../dto/banditActionRequest';
import { TestResponse } from '../dto/testResponse';
import { SDKRelay } from './SDKRelay';
import { SDKInfo } from './SDKInfo';
import { SDKConnectionFailure } from './SDKConnectionFailure';
import { ASSIGNMENT_PATH, BANDIT_PATH, DETAILS_PATH, RESET_PATH } from './constants';

/**
 * Uses `axios` to communicate with a Server SDK Relay via http
 */

export class ServerSDKRelay implements SDKRelay {
  private sdkRelayAddress: string;
  private sdkInfo: SDKInfo;
  private isReadyPromise: Promise<SDKInfo>;

  constructor(serverAddress: string, sdkName: string) {
    this.sdkRelayAddress = serverAddress;

    // By default, assume all servers support bandits and dynamic typing.
    this.sdkInfo = { sdkName, supportsBandits: true, supportsDynamicTyping: true };

    this.isReadyPromise = this.fetchSDKDetails()
      .then((sdkDetails: SDKInfo) => {
        this.sdkInfo = { ...this.sdkInfo, ...sdkDetails };
        return this.sdkInfo;
      })
      .catch((error) => {
        // Can proceed even if the relay doesn't return a details block.
        console.log(
          'Possible error encountered getting SDK details; not all SDK relays support the sdk/details endpoint',
          error,
        );
        return this.sdkInfo;
      });
  }

  getSDKDetails(): SDKInfo {
    return this.sdkInfo;
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
    return this.isReadyPromise;
  }

  async getAssignment(request: AssignmentRequest): Promise<TestResponse> {
    return axios.post(`${this.sdkRelayAddress}${ASSIGNMENT_PATH}`, request).then((result) => {
      return result.data as TestResponse;
    });
  }

  async fetchSDKDetails(): Promise<SDKInfo> {
    const result = await axios.get(`${this.sdkRelayAddress}${DETAILS_PATH}`);
    return result.data as SDKInfo;
  }
}
