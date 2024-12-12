import {Body, Controller, Get, Post} from '@nestjs/common';
import { AppService } from './app.service';
import {getInstance} from "@eppo/node-server-sdk";

export type AttributeType = string | number | boolean;
export type SubjectAttributes = Record<string, AttributeType>;

export class AssignmentDto {
  flag: string;
  assignmentType: string;
  defaultValue: string;
  subjectKey: string;
  subjectAttributes: SubjectAttributes;
}

class EppoClientProxy {
  getAssignment(assignmentRequestBody: AssignmentDto) {
    const eppoClientInstance = getInstance();

    return eppoClientInstance.getStringAssignmentDetails(
      assignmentRequestBody.flag,
      assignmentRequestBody.subjectKey,
      assignmentRequestBody.subjectAttributes,
      assignmentRequestBody.defaultValue,
    );
  }
}

@Controller()
export class AppController {
  eppoClientProxy = new EppoClientProxy();
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('flags/v1/assignment')
  getAssignment(@Body() requestedAssignmentBody: AssignmentDto) {
    const assignment = this.eppoClientProxy.getAssignment(
      requestedAssignmentBody,
    );
    console.log(assignment);
    return 'ok';
  }
}

// {
//   "flag": "integer-flag",
//   "assignmentType": "INTEGER",
//   "defaultValue": 0,
//   "subjectKey": "alice",
//   "subjectAttributes": {"email": "alice@mycompany.com", "country": "US"}
// }