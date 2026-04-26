// @ts-check
import fs from "node:fs";
import config from "../cfg.json" with { type: "json" };

fs.mkdirSync(config.tempDir, { recursive: true });

// class ConfigError {
//     /**
//      * 
//      * @param {string} msg 
//      */
//     constructor(msg) {
//         throw new Error(msg);
//     }
// }

export default config;
