import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RelayLogger } from './relayLogger';
import { init } from '@eppo/node-server-sdk';

let logger: RelayLogger;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  logger = new RelayLogger();

  await init({
    apiKey: '',
    assignmentLogger: logger,
    pollAfterFailedInitialization: true,
    banditLogger: logger,
    baseUrl: 'http://localhost:4000/api',
    pollingIntervalMs: 5000,
  });

  await app.listen(process.env.SDK_RELAY_PORT ?? 4000);
}

export default function getLogger(): RelayLogger {
  return logger;
}

bootstrap();
