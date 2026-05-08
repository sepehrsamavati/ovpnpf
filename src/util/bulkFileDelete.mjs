// @ts-check

import fs from "node:fs";
import consoleWithTimestamp from "../common/consoleWithTimestamp.mjs";

/**
 * 
 * @param {string} name 
 * @param {string[]} filePaths 
 */
export default function (name, filePaths) {
    let count = filePaths.length, deletedCount = 0;
    /** @type {unknown} */
    let lastError = null;

    for (const filePath of filePaths) {
        try {
            fs.unlinkSync(filePath);
            deletedCount++;
        } catch (err) {
            lastError = err;
        }
    }

    if (count === 0)
        consoleWithTimestamp.log(`[${name}] No file to delete.`);
    else {
        consoleWithTimestamp.log(`[${name}] Deleted ${deletedCount} file(s) (${deletedCount}/${count}).`);
        if (lastError !== null)
            consoleWithTimestamp.error(`[${name}] Last delete error:\n`, lastError);
    }
}
