import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { AssignmentDto } from './types';
import { EppoClientProxy } from './eppoClientProxy';

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
    const assignment = this.eppoClientProxy.getAssignment(requestedAssignmentBody);
    console.log(assignment);
    return 'ok';
  }
}
