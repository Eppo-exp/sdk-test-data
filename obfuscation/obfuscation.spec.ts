
import * as fs from "fs";
import * as path from "path";
import * as ufcFlags from "../ufc/flags-v1.json";
import { obfuscateUniversalFlagConfig } from "./obfuscation.helper";
import { UniversalFlagConfig } from "./ufc.dto";

describe('Obfuscate UFC config', () => {

  it("Obfuscate UFC flags config", () => {
    const ufc = ufcFlags as UniversalFlagConfig;
    const resultObfuscatedUfc = obfuscateUniversalFlagConfig(ufc);
    fs.writeFileSync(path.join(__dirname, "../ufc/flags-v1-obfuscated.json"), JSON.stringify(resultObfuscatedUfc, null, 2));
  });

});
