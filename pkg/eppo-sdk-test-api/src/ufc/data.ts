import * as crypto from "crypto";

const dataFiles: Record<string, {ufc: string, ufcDataVersion: string, bandits: string}> = {};
const clientDataMap: Record<string, string> = {};

export const getDataForRequest = (sdkName: string) => {
    // Get the scenario label for this client.
    let label = clientDataMap[sdkName];

    // If there was no label, assign the first of the data files (or null).
    if (!label) label = Object.keys(dataFiles)[0] ?? null;

    // If still no label, return null.
    if (!label) return null;

    return dataFiles[label] ?? null;
}

export const setDataFile = (label:string, ufc: string, bandits: string) => {
    const ufcVersionString = crypto.createHash('md5').update(ufc).digest('hex');

    dataFiles[label] ={ufc, ufcDataVersion: ufcVersionString, bandits};
}

export const updateClientDataMap = (sdkName: string, datafileLabel: string) => {
    console.log(clientDataMap);
    clientDataMap[sdkName] = datafileLabel;
}