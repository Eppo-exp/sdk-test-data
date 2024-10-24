import { config as configDotenv } from 'dotenv';
import minimist from 'minimist';
import { resolve } from 'path';

const argv = minimist(process.argv.slice(2));

configDotenv({
  path: resolve(__dirname, '../.env'),
});

export enum SdkType {
  CLIENT,
  SERVER,
}

class Config {
  public readonly scenarioFile: string;
  public readonly sdkServer: string;
  public readonly sdkName: string;
  public readonly logPrefix: string;
  public readonly apiServer: string;
  public readonly testDataPath: string;
  public readonly junitPath: string;
  public readonly sdkType: SdkType;

  public constructor() {
    this.testDataPath = process.env.EPPO_TEST_DATA_PATH || './test-data';
    this.scenarioFile = process.env.EPPO_SCENARIO_FILE || 'scenarios.json';

    this.logPrefix = process.env.LOG_PREFIX ?? '';

    const host = 'http://' + (process.env.SDK_RELAY_HOST ?? 'localhost');
    const port = process.env.SDK_RELAY_PORT ?? '4000';
    this.sdkServer = `${host}:${port}`;

    this.apiServer = `http://${process.env.EPPO_API_HOST ?? 'localhost'}:${process.env.EPPO_API_PORT ?? 5000}`;

    this.junitPath = argv.junit;

    this.sdkType = argv.type == 'client' ? SdkType.CLIENT : SdkType.SERVER;

    if (!process.env.SDK_NAME) {
      throw new Error('Must specify SDK under test');
    } else {
      this.sdkName = process.env.SDK_NAME;
    }
  }
}

export default new Config();
