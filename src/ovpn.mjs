// @ts-check

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import config from './config.mjs';
import { generateCode } from './util/otp.mjs';
import { parentPort } from "node:worker_threads";

const configPath = config.openVpn.configFullPath;

// temp auth file
const authFile = path.join(config.tempDir, `ovpn-auth-${Date.now()}.txt`);

const deleteAuthFile = () => {
    try {
        fs.unlinkSync(authFile);
    } catch { }
};

const MAX_RETRIES = 15;
const RECONNECT_DELAY = 3000;

let retryCount = 0;
/** @type {import('node:child_process').ChildProcessWithoutNullStreams | null} */
let vpnProcess = null;

async function startVPN() {
    console.log(`🔄 Starting VPN (attempt ${retryCount + 1})`);

    const username = config.openVpn.username;
    const password = config.openVpn.passwordOrOtpSecret.startsWith('otpauth://') ? await generateCode(config.openVpn.passwordOrOtpSecret) : config.openVpn.passwordOrOtpSecret;
    fs.writeFileSync(authFile, `${username}\n${password}\n`, { mode: 0o600 });

    vpnProcess = spawn(
        config.openVpn.executablePath,
        [
            "--config",
            configPath,
            "--auth-user-pass",
            authFile,
            ...(config.openVpn.shaper ? ["--shaper", config.openVpn.shaper.toString()] : [])
        ]
    );

    vpnProcess.once("spawn", () => {
        setTimeout(deleteAuthFile, 1e3);
    });

    vpnProcess.stdout.on("data", (data) => {
        const text = data.toString();
        process.stdout.write(`OVPN >_ `);
        process.stdout.write(data);

        if (text.includes("Initialization Sequence Completed")) {
            console.log("✅ VPN connected");
            deleteAuthFile();
            retryCount = 0; // reset on success

            parentPort?.postMessage("connected");
        }

        if (text.includes("AUTH_FAILED")) {
            console.log("❌ VPN auth failed");
            deleteAuthFile();
        }
    });

    vpnProcess.stderr.on("data", (data) => {
        console.error("[VPN ERROR]", data.toString());
    });

    vpnProcess.on("close", (code) => {
        console.log(`⚠️ VPN exited with code: ${code}`);
        parentPort?.postMessage("disconnected");

        // cleanup();

        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`🔁 Reconnecting in ${RECONNECT_DELAY}ms...`);

            setTimeout(() => {
                startVPN();
            }, RECONNECT_DELAY);
        } else {
            console.log("🛑 Max retries reached. Stopping.");
        }
    });

    vpnProcess.on("error", (err) => {
        deleteAuthFile();
        console.error("❌ Failed to start VPN process:", err);
    });
}

process.on("SIGINT", () => {
    deleteAuthFile();
    console.log("🛑 Stopping VPN...");
    if (vpnProcess) vpnProcess.kill("SIGTERM");
    process.exit();
});

parentPort?.on("message", message => {
    switch (message) {
        case "exit":
            vpnProcess?.kill("SIGTERM");
    }
});

startVPN();