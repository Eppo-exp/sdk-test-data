import type { NextApiRequest, NextApiResponse } from 'next';
import {getInstance, IAssignmentLogger, init} from "@eppo/node-server-sdk";


const assignmentLogger: IAssignmentLogger = {
    logAssignment(assignment) {
       console.log(assignment);
    },
};


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    await init({assignmentLogger, apiKey: "dummy KEY", baseUrl: 'http://localhost:5000/api' });

    const client = getInstance();

    const result = client.getBooleanAssignment('kill-switch', 'MySubjectId', {country: 'US' }, false);

    res.status(200).json({ flag: 'kill-switch', value: result});
}

