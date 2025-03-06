import {createHash} from "node:crypto";

// npx ts-node generate.ts

function hashAndEncode(jsonData: { precomputed: { response: any; }; }) {
    const salt = jsonData.precomputed.response.salt;
    const flags = jsonData.precomputed.response.flags;

    // Process each flag
    for (const [flagKey, flag] of Object.entries(flags)) {
        // Hash flag key with salt
        const hashedKey = createHash('md5')
            .update(salt + flagKey)
            .digest('hex');

        // Base64 encode specific fields
        // @ts-ignore
        flag.allocationKey = Buffer.from(flag.allocationKey).toString('base64');
        // @ts-ignore
        flag.variationKey = Buffer.from(flag.variationKey).toString('base64');
        // @ts-ignore
        flag.variationValue = Buffer.from(String(flag.variationValue)).toString('base64');

        // Process extraLogging if it has properties
        // @ts-ignore
        if (flag.extraLogging && Object.keys(flag.extraLogging).length > 0) {
            const newExtraLogging = {};
            // @ts-ignore
            for (const [key, value] of Object.entries(flag.extraLogging)) {
                const encodedKey = Buffer.from(key).toString('base64');
                const encodedValue = Buffer.from(String(value)).toString('base64');
                // @ts-ignore
                newExtraLogging[encodedKey] = encodedValue;
            }
            // @ts-ignore
            flag.extraLogging = newExtraLogging;
        }

        // Replace the original flag key with hashed key
        flags[hashedKey] = flag;
        delete flags[flagKey];
    }

    // Set obfuscated to true and stringify flags
    jsonData.precomputed.response.salt = salt;
    jsonData.precomputed.response.obfuscated = true;
    jsonData.precomputed.response = JSON.stringify(jsonData.precomputed.response);

    return jsonData;
}

const fs = require('fs');
const inputFile = 'precomputed-v1-deobfuscated.json';
const outputFile ='precomputed-v1.json';

const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const encodedData = hashAndEncode(jsonData);
fs.writeFileSync(outputFile, JSON.stringify(encodedData, null, 2));
