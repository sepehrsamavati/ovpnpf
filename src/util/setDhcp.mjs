// @ts-check

import { exec } from "child_process";

/**
 * 
 * @param {string} interfaceName 
 * @returns {Promise<{ ok: boolean; message: string; }>}
 */
export default function setDhcp(interfaceName) {
    return new Promise(resolve => {
        const cmd = `netsh interface ip set address name="${interfaceName}" dhcp`;

        exec(cmd, (error, stdout, stderr) => {

            if (stdout.trim() === "DHCP is already enabled on this interface.")
                return resolve({
                    ok: true,
                    message: stdout,
                });

            if (error) {
                return resolve({
                    ok: false,
                    message: stderr || error.message,
                });
            }

            resolve({
                ok: true,
                message: stdout,
            });
        });
    });
}
