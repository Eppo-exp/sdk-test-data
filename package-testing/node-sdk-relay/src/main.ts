import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RelayLogger } from './relayLogger';
import { init } from '@eppo/node-server-sdk';

let logger: RelayLogger;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  logger = new RelayLogger();

  await init({
    apiKey: 'test',
    assignmentLogger: logger,
    pollAfterFailedInitialization: true,
    banditLogger: logger,
    baseUrl: process.env.EPPO_BASE_URL || 'http://localhost:5000/api',
  });

  await app.listen(process.env.SDK_RELAY_PORT ?? 4000);
}

export default function getLogger(): RelayLogger {
  return logger;
}

bootstrap();
