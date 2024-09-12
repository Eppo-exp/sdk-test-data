import { config as configDotenv } from 'dotenv';
import { resolve } from 'path';

configDotenv({
  path: resolve(__dirname, '../.env'),
});

class Config {
  public readonly testDataPath: string;
  public readonly scenarioFile: string;
  public readonly serverPort: number;

  public constructor() {
    const port = parseInt(process.env.EPPO_API_PORT ?? '');
    this.serverPort = port && isFinite(port) ? port : 5000;

    this.testDataPath = process.env.EPPO_TEST_DATA_PATH || './test-data';
    this.scenarioFile = process.env.EPPO_SCENARIO_FILE || 'scenarios.json';
  }
}

export default new Config();
