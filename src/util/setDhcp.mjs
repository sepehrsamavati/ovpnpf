// @ts-check

import { exec } from "child_process";

/**
 * 
 * @param {string} interfaceName 
 * @returns 
 */
export default function setDhcp(interfaceName) {
    return new Promise((resolve, reject) => {
        const cmd = `netsh interface ip set address name="${interfaceName}" dhcp`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                return reject(stderr || error.message);
            }
            resolve(stdout);
        });
    });
}
