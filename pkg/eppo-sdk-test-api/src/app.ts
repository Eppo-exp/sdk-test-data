import express from 'express';
import routes from './routes';

import * as fs from 'fs'
import { setDataFile, updateClientDataMap } from './ufc/data';

class App {

    private static SCENARIO_FILE = "./scenario_config.json";

    public server;

    constructor() {
        this.server = express();

        this.middlewares();
        this.routes();
    }

    middlewares() {
        this.server.use(express.json());
    }

    routes() {
        this.server.use(routes);
    }

    public loadDatafiles(baseDir: string) {
        console.log("Loading test scenarios");
        
        const scenarioMeta = JSON.parse(fs.readFileSync(App.SCENARIO_FILE, "utf-8"));
        const scenarios = scenarioMeta["scenarios"];
        const clientMaps = scenarioMeta["initialClientMap"];

        Object.keys(scenarios).forEach(key => {
            const ufc = fs.readFileSync(baseDir + scenarios[key]["ufcPath"], "utf-8");

            const banditModelFile = scenarios[key]["banditModelPath"];
            
            const bandits =  !!banditModelFile ? fs.readFileSync(baseDir + banditModelFile, "utf-8"): '';

            console.log("preloaded data for " + key);

            setDataFile(key,
                ufc, 
                bandits);
        });

        Object.keys(clientMaps).forEach(key => {
            console.log("Setting data response for: " + key);
            updateClientDataMap(key, clientMaps[key]);
        });
    }

}

export default new App();
