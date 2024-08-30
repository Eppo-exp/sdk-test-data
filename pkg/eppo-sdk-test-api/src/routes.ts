import { Router } from 'express';
import * as fs from 'fs';
import { getDataForRequest, setDataFile, updateClientDataMap } from './ufc/data';
import { STATUS_CODES } from 'http';

const routes = Router();

// TODO delete
routes.get('/', (req, res) => {
    return res.json({ message: 'Hello World' });
});


// Serve Unified Flag Config
routes.get('/flag-config/v1/config', (req, res) => {
    const sdk: string = req.query.sdkName as string;

    const data = getDataForRequest(sdk);

    if (data) {
        // Some SDKs use HTTP headers to optimize network bytes and sdk-side processing.
        const noneMatch = req.header("IF-NONE-MATCH");
        if (!!noneMatch && noneMatch == data.ufcDataVersion) {
            res.setHeader('E_TAG', data.ufcDataVersion);
            return res.status(304).end();
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.setHeader('E_TAG', data.ufcDataVersion);
        return res.end(data.ufc);
    }

    return res.status(404).json({ "message": "No data for specified SDK" });
});

// Serve bandit models
routes.get('/flag-config/v1/bandits', (req, res) => {
    const sdk: string = req.query.sdkName as string;

    const data = getDataForRequest(sdk);

    if (data) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        return res.end(data.bandits);
    }

    return res.status(404).json({ "message": "No data for specified SDK" });
});


// Allow a test runner to change the scenario for an SDK
routes.post('/sdk/:sdk/scenario', (req, res) => {
    const scenarioLabel = req.body.label;
    const sdkName = req.params.sdk;

    console.log(`Setting scenario to "${scenarioLabel}" for ${sdkName}`);
    updateClientDataMap(sdkName, scenarioLabel);

    return res.status(200).end();
});

export default routes;
