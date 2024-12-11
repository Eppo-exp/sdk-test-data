import {getInstance, IAssignmentLogger, init} from "@eppo/node-server-sdk";


export const assignmentLogger: IAssignmentLogger = {
    logAssignment(assignment) {
        console.log(assignment);
    },
};

let clientInitialized = false;
export async function getClient() {
    if (!clientInitialized) {
        await init({assignmentLogger, apiKey: "dummy KEY", baseUrl: 'http://localhost:5000/api'});

        clientInitialized = true;

    }
    return getInstance();
}