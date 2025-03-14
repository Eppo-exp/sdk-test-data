import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { AssignmentDto, BanditDto, BanditTestRunnerInput } from './types';
import { EppoClientProxy } from './eppoClientProxy';
import { BanditActions, getInstance, init } from '@eppo/node-server-sdk';
import getLogger from './main';
import { sdkName, sdkVersion } from '@eppo/node-server-sdk/dist/sdk-data';

@Controller()
export class AppController {
  eppoClientProxy = new EppoClientProxy();
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('sdk/details')
  getSdkDetails() {
    return { sdkName, sdkVersion, supportsBandits: true, supportsDynamicTyping: true };
  }

  @Post('flags/v1/assignment')
  getAssignment(@Body() requestedAssignmentBody: AssignmentDto) {
    return this.eppoClientProxy.getAssignment(getInstance(), requestedAssignmentBody);
  }

  @Post('/bandits/v1/action')
  getBanditAction(@Body() requestedBanditBody: BanditTestRunnerInput) {
    const parsedActions: BanditActions = {};
    const parsedInput: BanditDto = JSON.parse(JSON.stringify(requestedBanditBody));

    if (requestedBanditBody.actions instanceof Array) {
      for (const action of requestedBanditBody.actions) {
        parsedActions[action.actionKey] = action;
        delete action.actionKey;
      }

      parsedInput.actions = parsedActions;
    }

    return this.eppoClientProxy.getBanditAction(getInstance(), parsedInput);
  }

  @HttpCode(200)
  @Post('/sdk/reset')
  async resetSdk() {
    const currentInstance = getInstance();
    currentInstance.stopPolling();
    await init({
      apiKey: process.env.EPPO_API_KEY || 'NOKEYSPECIFIED',
      assignmentLogger: getLogger(),
      pollAfterFailedInitialization: true,
      banditLogger: getLogger(),
      baseUrl: process.env.EPPO_BASE_URL || 'http://localhost:5000/api',
    });

    return {};
  }
}
