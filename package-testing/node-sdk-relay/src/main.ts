import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  IAssignmentLogger,
  IBanditEvent,
  IBanditLogger,
  init,
} from '@eppo/node-server-sdk';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const assignmentLogger: IAssignmentLogger = {
    logAssignment(assignment) {
      console.log(assignment);
    },
  };

  const banditLogger: IBanditLogger = {
    logBanditAction(banditEvent: IBanditEvent) {
      console.log(banditEvent);
    },
  };
  await init({
    apiKey: 'V29Io3djtYg4CNAovws8bnZGC.ZWg9N2hhZWpjLmUuZXBwby5jbG91ZA',
    assignmentLogger,
    pollAfterFailedInitialization: true,
    pollingIntervalMs: 5000,
    banditLogger: banditLogger,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
