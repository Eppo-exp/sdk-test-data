import { AssignmentRequest } from '../dto/assignmentRequest';
import { BanditActionRequest } from '../dto/banditActionRequest';
import { TestResponse } from '../dto/testResponse';
import { SDKConnectionFailure } from './SDKConnectionFailure';
import { SDKInfo } from './SDKInfo';

/**
 * Wrapper for calls to an SDK relay
 */

export type SDKRelay = {
  isReady(timeout: number): Promise<SDKInfo | SDKConnectionFailure>;
  reset(): Promise<void>;
  getAssignment(request: AssignmentRequest): Promise<TestResponse>;
  getBanditAction(request: BanditActionRequest): Promise<TestResponse>;
  close(): void;
  getSDKDetails(): SDKInfo;
};
