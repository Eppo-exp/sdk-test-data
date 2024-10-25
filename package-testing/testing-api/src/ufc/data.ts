import * as crypto from 'crypto';

const dataFiles: Record<string, { ufc: string; eTag: string; bandits: string }> = {};
const clientDataMap: Record<string, string> = {};

const obfuscatedClients = ['android'];

export const isObfuscatedSdk = (sdkName: string): boolean => {
  return sdkName in obfuscatedClients;
};

export const getDataForRequest = (sdkName: string) => {
  // Get the scenario label for this client.
  let label = clientDataMap[sdkName];

  // If there was no label, assign the first of the data files (or null).
  label ??= Object.keys(dataFiles)[0] ?? null;

  console.log(`Returning ${label} for ${sdkName}`);

  const filename = dataFiles[label] ?? null;

  return filename;
};

export const setDataFile = (label: string, ufc: string, bandits: string) => {
  const ufcVersionString = crypto.createHash('md5').update(ufc).digest('hex');

  dataFiles[label] = { ufc, eTag: ufcVersionString, bandits };
};

export const updateClientDataMap = (sdkName: string, datafileLabel: string): boolean => {
  if (!dataFiles[datafileLabel]) {
    return false;
  }

  clientDataMap[sdkName] = datafileLabel;
  return true;
};
