import App from './app';
import config from './config';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
console.log(argv);
console.log(config);

// process.exit(0);

const app = new App(
  config.sdkName,
  config.sdkServer,
  config.apiServer,
  config.testDataPath,
  config.scenarioFile,
  argv.jUnit,
);

(async () => {
  const result = await app.run();
  process.exit(result);
})();
