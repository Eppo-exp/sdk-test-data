import {getInstance, IAssignmentLogger, init} from "@eppo/js-client-sdk";

export const clientAssignmentLogger: IAssignmentLogger = {
    logAssignment(assignment) {
        console.log(assignment);
    },
};

let clientInit = false;
export async function getClientClient() {
    if (!clientInit) {
        await init({assignmentLogger: clientAssignmentLogger, apiKey: "dummy KEY", baseUrl: 'http://localhost:5000/api'});

        clientInit = true;

    }
    return getInstance();
}