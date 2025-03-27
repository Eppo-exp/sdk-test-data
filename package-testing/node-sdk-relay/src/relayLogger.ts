import { IAssignmentEvent, IAssignmentLogger, IBanditEvent, IBanditLogger } from '@eppo/node-server-sdk';

export class RelayLogger implements IAssignmentLogger, IBanditLogger {
  logAssignment(assignment: IAssignmentEvent) {
    console.log(assignment);
  }
  logBanditAction(banditEvent: IBanditEvent) {
    console.log(banditEvent);
  }
}
