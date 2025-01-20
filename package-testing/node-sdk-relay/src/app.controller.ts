import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { AssignmentDto, BanditDto } from './types';
import { EppoClientProxy } from './eppoClientProxy';
import { getInstance, init } from '@eppo/node-server-sdk';
import getLogger from './main';

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
    return this.eppoClientProxy.getAssignment(getInstance(), requestedAssignmentBody);
  }

  @Post('/bandits/v1/action')
  getBanditAction(@Body() requestedBanditBody: BanditDto) {
    if (requestedBanditBody.actions instanceof Array) {
      const parsedActions = {};
      for (const action of requestedBanditBody.actions) {
        parsedActions[action.actionKey] = action;
      }

      requestedBanditBody.actions = parsedActions;
    }

    return this.eppoClientProxy.getBanditAction(getInstance(), requestedBanditBody);
  }

  @HttpCode(200)
  @Post('/sdk/reset')
  async resetSdk() {
    const currentInstance = getInstance();
    currentInstance.stopPolling();
    await init({
      apiKey: 'test',
      assignmentLogger: getLogger(),
      pollAfterFailedInitialization: true,
      banditLogger: getLogger(),
      baseUrl: process.env.EPPO_BASE_URL || 'http://localhost:5000/api',
    });

    return {};
  }
}
