import App from './app';
import config from './config';

const app = new App(config);

(async () => {
  await app.run();
})();
