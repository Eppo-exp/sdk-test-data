import axios from 'axios';
import { AssignmentRequest } from './dto/assignmentRequest';
import { BanditActionRequest } from './dto/banditActionRequest';
import { TestResponse } from './dto/testResponse';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { green, log } from './logging';
import { EventEmitter } from 'stream';

const assignmentPath = '/flags/v1/assignment';
const banditPath = '/bandits/v1/action';

/**
 * Wrapper for calls to an SDK relay
 */
export type SDKRelay = {
  isReady(): Promise<boolean>;
  getAssignment(request: AssignmentRequest): Promise<TestResponse>;
  getBanditAction(request: BanditActionRequest): Promise<TestResponse>;
};

/**
 * Uses `axios` to communicate with a Server SDK Relay via http
 */
export class ServerSDKRelay implements SDKRelay {
  sdkRelayAddress: string;

  constructor(serverAddress: string) {
    this.sdkRelayAddress = serverAddress;
  }
  getBanditAction(request: BanditActionRequest): Promise<TestResponse> {
    return axios.post(`${this.sdkRelayAddress}${banditPath}`, request).then((result) => {
      return result.data as TestResponse;
    });
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
  private sdkName?: string;

  constructor(testrunnerPort: number = 3000) {
    const relay = this;
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
        relay.socket = socket;

        socket.on('READY', (msg, ack) => {
          const msgObj = JSON.parse(msg);

          relay.sdkName = msgObj.sdkName;

          log(green(`Client ${relay.sdkName} reports ready`));

          // Send ACK to the client and resolve the `isReady` promise.
          ack({ status: 'OK' });
          resolve((this._isReady = true));
        });

        socket.on('disconnect', () => {
          this.emitter.emit('disconnect', relay.sdkName);
          console.log(`client ${relay.sdkName} disconnected`);
        });
      });

      httpServer.listen(testrunnerPort);
    });
  }

  getBanditAction(request: BanditActionRequest): Promise<TestResponse> {
    throw new Error('Method not implemented.');
  }

  isReady(): Promise<boolean> {
    return this.isReadyPromise;
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
