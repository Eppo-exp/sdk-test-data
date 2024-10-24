import axios from 'axios';
import { AssignmentRequest } from './dto/assignmentRequest';
import { BanditActionRequest } from './dto/banditActionRequest';
import { TestResponse } from './dto/testResponse';

export type SDKRelay = {
  isReady(): Promise<boolean>;
  getAssignment(request: AssignmentRequest): Promise<TestResponse>;
  getBanditAction(request: BanditActionRequest): Promise<TestResponse>;
};

export class ServerSDKRelay implements SDKRelay {
  private static readonly assignmentPath = '/flags/v1/assignment';
  private static readonly banditPath = '/bandits/v1/action';

  sdkRelayAddress: string;

  constructor(serverAddress: string) {
    this.sdkRelayAddress = serverAddress;
  }
  getBanditAction(request: BanditActionRequest): Promise<TestResponse> {
    return axios.post(`${this.sdkRelayAddress}${ServerSDKRelay.banditPath}`, request).then((result) => {
      return result.data as TestResponse;
    });
  }

  isReady(): Promise<boolean> {
    return Promise.resolve(true);
  }

  async getAssignment(request: AssignmentRequest): Promise<TestResponse> {
    return axios.post(`${this.sdkRelayAddress}${ServerSDKRelay.assignmentPath}`, request).then((result) => {
      return result.data as TestResponse;
    });
  }
}

export class ClientSDKRelay implements SDKRelay {
  getBanditAction(request: BanditActionRequest): Promise<TestResponse> {
    throw new Error('Method not implemented.');
  }
  isReady(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  getAssignment(request: AssignmentRequest): Promise<TestResponse> {
    throw new Error('Method not implemented.');
  }
}
