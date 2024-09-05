import { config as configDotenv } from 'dotenv';
import { resolve } from 'path';

configDotenv({
  path: resolve(__dirname, '../.env'),
});

class Config {
  public readonly scenarioFile: string;
  public readonly sdkServer: string;
  public readonly sdkName: string;
  public readonly logPrefix: string;
  public readonly apiServer: string;

  public constructor() {
    this.logPrefix = process.env.LOG_PREFIX ?? '';
    this.scenarioFile = process.env.TEST_CASE_FILE ?? './scenarios.json';

    const host = process.env.SDK_SERVER_HOST ?? 'localhost';
    const port = process.env.SDK_SERVER_PORT ?? '4000';
    this.sdkServer = `${host}:${port}`;

    this.apiServer = `${process.env.API_SERVER_HOST ?? 'localhost'}:${process.env.API_SERVER_PORT ?? 5000}`;

    if(!process.env.SDK_NAME) {
      throw new Error("Must specify SDK under test");
    } else {
      this.sdkName = process.env.SDK_NAME;
    }

  }
}

export default new Config();
