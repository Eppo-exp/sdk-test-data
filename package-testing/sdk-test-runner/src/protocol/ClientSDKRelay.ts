import { AssignmentRequest } from '../dto/assignmentRequest';
import { BanditActionRequest } from '../dto/banditActionRequest';
import { TestResponse } from '../dto/testResponse';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { green, log } from '../logging';
import { EventEmitter } from 'stream';
import { SDKRelay } from './SDKRelay';
import { SDKInfo } from './SDKInfo';
import { SDKConnectionFailure } from './SDKConnectionFailure';
import { FeatureNotSupportedError } from './FeatureNotSupportedError';
import { ASSIGNMENT_PATH, BANDIT_PATH, RESET_PATH } from './constants';

/**
 * Uses `socket.io` to communicate with a Client SDK relay
 */

export class ClientSDKRelay implements SDKRelay {
  emitter = new EventEmitter();

  private isReadyPromise: Promise<SDKInfo>;
  private ready = false;
  private socket?: Socket;

  // Defaults for client SDKs
  private sdkInfo: SDKInfo = {
    supportsBandits: false,
    supportsDynamicTyping: true,
    sdkName: 'UNKNOWN',
  };

  constructor(testrunnerPort: number = 3000) {
    // Run socketIO through a node http server.
    const httpServer = createServer();
    const io = new Server(httpServer, {
      cors: {
        origin: '*',
      },
    });

    this.isReadyPromise = new Promise((resolve) => {
      // Listen for a connection
      io.on('connection', (socket) => {
        console.log('a client has connected');
        this.socket = socket;

        socket.on('READY', (msg, ack) => {
          const msgObj = JSON.parse(msg);

          this.sdkInfo = { ...this.sdkInfo, ...(msgObj as SDKInfo) };

          log(green(`Client ${this.sdkInfo?.sdkName} reports ready`));

          // Send ACK to the client and resolve the `isReady` promise.
          ack({ status: 'OK' });
          this.ready = true;
          resolve(this.sdkInfo);
        });

        socket.on('disconnect', () => {
          this.emitter.emit('disconnect', this.sdkInfo?.sdkName);
          console.log(`client ${this.sdkInfo?.sdkName} disconnected`);
        });
      });

      httpServer.listen(testrunnerPort);
    });
  }
  getSDKDetails(): SDKInfo {
    if (this.sdkInfo == null) {
      throw new Error('SDK Client is not connected');
    }
    return this.sdkInfo;
  }

  reset(): Promise<void> {
    if (!this.ready) {
      throw new Error('SDK Client is not connected');
    }
    return new Promise((resolve) => {
      this.socket?.emit(RESET_PATH, '', resolve);
    });
  }

  close(): void {
    this.socket?.disconnect(true);
  }

  async getBanditAction(request: BanditActionRequest): Promise<TestResponse> {
    if (!this.ready) {
      throw new Error('SDK Client is not connected');
    }
    if (!this.sdkInfo?.supportsBandits) {
      throw new FeatureNotSupportedError('Bandits are not supported in this SDK', 'Bandits');
    }

    const result = await new Promise((resolve) => {
      this.socket?.emit(BANDIT_PATH, request, resolve);
    });
    return JSON.parse(result as string) as TestResponse;
  }

  isReady(timeoutMs: number = 10 * 60 * 1000): Promise<SDKInfo | SDKConnectionFailure> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({ errorMessage: 'Client did not connect within timeout' });
      }, timeoutMs);

      this.isReadyPromise
        .then(resolve)
        .catch((error) => {
          resolve({ errorMessage: error });
        })
        .finally(() => clearTimeout(timeoutId));
    });
  }

  getAssignment(request: AssignmentRequest): Promise<TestResponse> {
    if (!this.ready) {
      throw new Error('SDK Client is not connected');
    }
    return new Promise((resolve) => {
      this.socket?.emit(ASSIGNMENT_PATH, request, resolve);
    }).then((result) => JSON.parse(result as string) as TestResponse);
  }
}
