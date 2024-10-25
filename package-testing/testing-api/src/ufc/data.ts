import * as crypto from 'crypto';

const dataFiles: Record<
  string,
  { ufc: string; obfuscatedUfc: string; eTag: string; obfuscatedETag: string; bandits: string }
> = {};
const clientDataMap: Record<string, string> = {};

const obfuscatedClients = ['android'];

export const isObfuscatedSdk = (sdk: string) => obfuscatedClients.includes(sdk);

export const getDataForRequest = (sdkName: string) => {
  // Get the scenario label for this client.
  let label = clientDataMap[sdkName];

  // If there was no label, assign the first of the data files (or null).
  label ??= Object.keys(dataFiles)[0] ?? null;

  console.log(`Returning scenario ${label} for ${sdkName}`);

  return dataFiles[label] ?? null;
};

export const setDataFile = (label: string, ufc: string, obfuscatedUfc: string, bandits: string) => {
  const eTag = crypto.createHash('md5').update(ufc).digest('hex');
  const obfuscatedETag = crypto.createHash('md5').update(obfuscatedUfc).digest('hex');

  dataFiles[label] = { ufc, obfuscatedUfc, eTag, obfuscatedETag, bandits };
};

export const updateClientDataMap = (sdkName: string, datafileLabel: string): boolean => {
  if (!dataFiles[datafileLabel]) {
    return false;
  }

  clientDataMap[sdkName] = datafileLabel;
  return true;
};
