import App from './app';
import config, { SdkType } from './config';

// process.exit(0);

const app = new App(
  config.sdkName,
  config.sdkServer,
  config.apiServer,
  config.testDataPath,
  config.scenarioFile,
  config.junitPath,
);

if (config.sdkType == SdkType.CLIENT) {
  // console.log('Error, Client type not supported yet.');
  app.runSocket();
} else {
  (async () => {
    await app.run();
  })();
}
