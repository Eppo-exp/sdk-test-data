import { RequestHandler, Router } from 'express';
import { getDataForRequest, isObfuscatedSdk, updateClientDataMap } from './ufc/data';

const routes = Router();

routes.get('/', (req, res) => {
  res.write('hello world');
  return res.status(200).end();
});

// Serve Unified Flag Config
const serveUFC: RequestHandler = (req, res) => {
  const sdk: string = req.query.sdkName as string;

  const data = getDataForRequest(sdk);

  if (data) {
    // Some SDKs use HTTP headers to optimize network bytes and sdk-side processing.
    const noneMatch = req.header('IF-NONE-MATCH');
    const eTagToMatch = isObfuscatedSdk(sdk) ? data.obfuscatedETag : data.eTag;

    if (noneMatch === eTagToMatch) {
      console.log(`Returning not modified`);
      res.setHeader('ETAG', data.eTag);
      return res.status(304).end();
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('ETAG', data.eTag);

    // Check if it should be an obfuscated response
    if (isObfuscatedSdk(sdk)) {
      console.log(`Returning obfuscated config`);
      return res.status(200).end(data.obfuscatedUfc);
    }
    return res.status(200).end(data.ufc);
  }

  return res.status(404).json({ message: 'No data for specified SDK' });
};

// Serve bandit params
const serveBanditParams: RequestHandler =(req, res) => {
  const sdk: string = req.query.sdkName as string;

  const data = getDataForRequest(sdk);

  if (data) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).end(data.bandits);
  }

  return res.status(404).json({ message: 'No data for specified SDK' });
};

// Serve with and without the /api prefix to accomodate SDKs in transition.
routes.get('/api/flag-config/v1/config', serveUFC);
routes.get('/api/flag-config/v1/bandits', serveBanditParams);

// For SDKs which in transition; they're passed a baseUrl including `/api` and are using endpoint constants which start with `api/`
routes.get('/api/api/flag-config/v1/config', serveUFC);
routes.get('/api/api/flag-config/v1/bandits', serveBanditParams);

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
