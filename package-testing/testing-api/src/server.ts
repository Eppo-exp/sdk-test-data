import config from './config';

import app from './app';

app.loadDatafiles(config.testDataPath, config.scenarioFile);

const port = config.serverPort;

console.log(`Listening at localhost:${port}`);

app.server.listen(port);
