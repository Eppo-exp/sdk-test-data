import { Router } from 'express';
import { getDataForRequest, isObfuscatedSdk, updateClientDataMap } from './ufc/data';

const routes = Router();

routes.get('/', (req, res) => {
  res.write('hello world');
  return res.status(200).end();
});

// Serve Unified Flag Config
routes.get('/flag-config/v1/config', (req, res) => {
  const sdk: string = req.query.sdkName as string;

  const data = getDataForRequest(sdk);

  if (data) {
    let filename = data.ufc;
    // Check if it should be an obfuscated response
    if (isObfuscatedSdk(sdk)) {
      filename = filename.replace('.json', '-obfuscated.json');
    }

    // Some SDKs use HTTP headers to optimize network bytes and sdk-side processing.
    const noneMatch = req.header('IF-NONE-MATCH');
    if (noneMatch === data.eTag) {
      res.setHeader('ETAG', data.eTag);
      return res.status(304).end();
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('ETAG', data.eTag);
    return res.status(200).end(filename);
  }

  return res.status(404).json({ message: 'No data for specified SDK' });
});

// Serve bandit models
routes.get('/flag-config/v1/bandits', (req, res) => {
  const sdk: string = req.query.sdkName as string;

  const data = getDataForRequest(sdk);

  if (data) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).end(data.bandits);
  }

  return res.status(404).json({ message: 'No data for specified SDK' });
});

// Allow a test runner to change the scenario for an SDK
routes.post('/sdk/:sdk/scenario', (req, res) => {
  const scenarioLabel = req.body.label;
  const sdkName = req.params.sdk;

  console.log(`Setting scenario to "${scenarioLabel}" for ${sdkName}`);
  const result = updateClientDataMap(sdkName, scenarioLabel);

  if (!result) {
    res.status(404).write(`Scenario "${scenarioLabel}" not found.`);
    return res.end();
  }

  return res.status(200).end();
});

export default routes;
