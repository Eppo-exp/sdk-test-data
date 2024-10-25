import axios from 'axios';
import { AssignmentRequest } from './dto/assignmentRequest';
import { BanditActionRequest } from './dto/banditActionRequest';
import { TestResponse } from './dto/testResponse';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { green, log, red } from './logging';
import { EventEmitter } from 'stream';

const assignmentPath = '/flags/v1/assignment';
const banditPath = '/bandits/v1/action';
const resetPath = '/sdk/reset';

/**
 * Wrapper for calls to an SDK relay
 */
export type SDKRelay = {
  isReady(timeout: number): Promise<boolean>;
  reset(): Promise<void>;
  getAssignment(request: AssignmentRequest): Promise<TestResponse>;
  getBanditAction(request: BanditActionRequest): Promise<TestResponse>;
  close(): void;
};

/**
 * Uses `axios` to communicate with a Server SDK Relay via http
 */
export class ServerSDKRelay implements SDKRelay {
  private sdkRelayAddress: string;

  constructor(serverAddress: string) {
    this.sdkRelayAddress = serverAddress;
  }

  close(): void {
    return; // nothing to do.
  }

  async reset(): Promise<void> {
    const result = await axios.post(`${this.sdkRelayAddress}/sdk/reset`, {});
    if (result.status != 200) {
      throw new Error(`API Server returned unexpected status: ${result.status}`);
    }
  }

  async getBanditAction(request: BanditActionRequest): Promise<TestResponse> {
    const result = await axios.post(`${this.sdkRelayAddress}${banditPath}`, request);
    return result.data as TestResponse;
  }

  isReady(): Promise<boolean> {
    return Promise.resolve(true);
  }

  async getAssignment(request: AssignmentRequest): Promise<TestResponse> {
    return axios.post(`${this.sdkRelayAddress}${assignmentPath}`, request).then((result) => {
      return result.data as TestResponse;
    });
  }
}

/**
 * Uses `socket.io` to communicate with a Client SDK relay
 */
export class ClientSDKRelay implements SDKRelay {
  emitter = new EventEmitter();

  private isReadyPromise: Promise<boolean>;
  private _isReady = false;
  private socket?: Socket;
  private sdkInfo?: { sdkName: string; supportsBandits: boolean };

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

          this.sdkInfo = msgObj;

          log(green(`Client ${this.sdkInfo?.sdkName} reports ready`));

          // Send ACK to the client and resolve the `isReady` promise.
          ack({ status: 'OK' });
          resolve((this._isReady = true));
        });

        socket.on('disconnect', () => {
          this.emitter.emit('disconnect', this.sdkInfo?.sdkName);
          console.log(`client ${this.sdkInfo?.sdkName} disconnected`);
        });
      });

      httpServer.listen(testrunnerPort);
    });
  }

  reset(): Promise<void> {
    if (!this._isReady) {
      throw new Error('SDk Client is not connected');
    }
    return new Promise((resolve) => {
      this.socket?.emit(resetPath, '', resolve);
    });
  }

  close(): void {
    this.socket?.disconnect(true);
  }

  async getBanditAction(request: BanditActionRequest): Promise<TestResponse> {
    if (!this._isReady) {
      throw new Error('SDk Client is not connected');
    }
    if (!this.sdkInfo?.supportsBandits) {
      throw new FeatureNotSupportedError('Bandits are not supported in this SDK');
    }

    const result = await new Promise((resolve) => {
      this.socket?.emit(banditPath, request, resolve);
    });
    return JSON.parse(result as string) as TestResponse;
  }

  isReady(timeout: number = 10 * 60 * 1000): Promise<boolean> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        log(red('Promise timed out'));
        resolve(false);
      }, timeout);

      this.isReadyPromise
        .then(resolve)
        .catch((error) => {
          log(red(error));
          resolve(false);
        })
        .finally(() => clearTimeout(timeoutId));
    });
  }

  getAssignment(request: AssignmentRequest): Promise<TestResponse> {
    if (!this._isReady) {
      throw new Error('SDk Client is not connected');
    }
    return new Promise((resolve) => {
      this.socket?.emit(assignmentPath, request, resolve);
    }).then((result) => JSON.parse(result as string) as TestResponse);
  }
}

export class FeatureNotSupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeatureNotSupportedError';
  }
}
