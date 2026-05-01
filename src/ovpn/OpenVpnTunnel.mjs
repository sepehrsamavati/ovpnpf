// @ts-check

import fs from 'fs';
import path from 'path';
import config from '../config.mjs';
import { spawn } from 'child_process';
import { generateCode } from '../util/otp.mjs';
import formatBytes from '../util/formatBytes.mjs';
import setDhcp from '../util/setDhcp.mjs';

export default class OpenVpnTunnel {
    static MAX_RETRIES = 15;
    static RECONNECT_DELAY = 3000;

    static logger = console;

    static #resetDhcp() {
        setDhcp("OpenVPN Data Channel Offload")
            .then(console.log)
            .catch(console.error);

        setDhcp("OpenVPN Connect DCO Adapter")
            .then(console.log)
            .catch(console.error);
    }

    /**
     * @param {string} filePath
     */
    static #parseOpenVpnStatus(filePath) {
        const text = fs.readFileSync(filePath, "utf8");

        if (!text.includes("END")) {
            return null; // incomplete write
        }

        /** @type {Record<string, string>} */
        const result = {};

        for (const line of text.split('\n')) {
            if (!line.includes(',')) continue;

            const [key, value] = line.split(',');

            result[key.trim()] = value.trim();
        }

        return {
            updated: result["Updated"],
            tunRx: Number(result["TUN/TAP read bytes"] || 0),
            tunTx: Number(result["TUN/TAP write bytes"] || 0),
            netRx: Number(result["TCP/UDP read bytes"] || 0),
            netTx: Number(result["TCP/UDP write bytes"] || 0),
            auth: Number(result["Auth read bytes"] || 0),
        };
    }

    constructor() {
        process.on("SIGINT", () => {
            this.dispose();
            console.log("🛑 Stopping VPN...");
            if (this.#vpnProcess) this.#vpnProcess.kill("SIGTERM");
            process.exit();
        });
    }

    /** @type {?()=>void} */
    onConnected = null;

    /** @type {?()=>void} */
    onDisconnected = null;

    getVpnUsage() {
        const usage = OpenVpnTunnel.#parseOpenVpnStatus(this.#statusLogFilePath);

        if (!usage)
            return null;

        const total = usage.tunRx + usage.tunTx;

        return {
            rx: formatBytes(usage.tunRx),
            tx: formatBytes(usage.tunTx),
            total: formatBytes(total),
            totalBytes: total,
        };
    }

    #constructDate = Date.now();
    #authFilePath = path.join(config.tempDir, `ovpn-auth-${this.#constructDate}.txt`);
    #statusLogFilePath = path.join(config.tempDir, `ovpn-status-${this.#constructDate}.log`);
    #retryCount = 0;
    /** @type {import('node:child_process').ChildProcessWithoutNullStreams | null} */
    #vpnProcess = null;

    #deleteStatusLogFile() {
        try {
            fs.unlinkSync(this.#statusLogFilePath);
        } catch { }
    }

    #deleteAuthFile() {
        try {
            fs.unlinkSync(this.#authFilePath);
        } catch { }
    }

    dispose() {
        this.#deleteAuthFile();
        if (config.openVpn.trafficUsage?.keepLog === false)
            this.#deleteStatusLogFile();
    }

    terminateProcess() {
        this.#vpnProcess?.kill("SIGTERM");
    }

    async startVPN() {
        OpenVpnTunnel.logger.log(`🔄 Starting VPN (attempt ${this.#retryCount + 1})`);

        OpenVpnTunnel.#resetDhcp();

        const username = config.openVpn.username;
        const password = config.openVpn.passwordOrOtpSecret.startsWith('otpauth://') ? await generateCode(config.openVpn.passwordOrOtpSecret) : config.openVpn.passwordOrOtpSecret;
        fs.writeFileSync(this.#authFilePath, `${username}\n${password}\n`, { mode: 0o600 });

        this.#vpnProcess = spawn(
            config.openVpn.executablePath,
            [
                "--config",
                config.openVpn.configFullPath,
                "--auth-user-pass",
                this.#authFilePath,
                ...(config.openVpn.trafficUsage ? ["--status", this.#statusLogFilePath, "1"] : []),
                ...(config.openVpn.shaper ? ["--shaper", config.openVpn.shaper.toString()] : []),
            ]
        );

        this.#vpnProcess.once("spawn", () => {
            setTimeout(this.#deleteAuthFile, 1e3);
        });

        this.#vpnProcess.stdout.on("data", (data) => {
            const text = data.toString();
            process.stdout.write(`OVPN >_ `);
            process.stdout.write(data);

            if (text.includes("Initialization Sequence Completed")) {
                OpenVpnTunnel.logger.log("✅ VPN connected");
                this.#deleteAuthFile();
                this.#retryCount = 0; // reset on success

                this.onConnected?.();
            }

            if (text.includes("AUTH_FAILED")) {
                OpenVpnTunnel.logger.log("❌ VPN auth failed");
                this.#deleteAuthFile();
            }
        });

        this.#vpnProcess.stderr.on("data", (data) => {
            OpenVpnTunnel.logger.error("[VPN ERROR]", data.toString());
        });

        this.#vpnProcess.on("close", (code) => {
            OpenVpnTunnel.logger.log(`⚠️ VPN exited with code: ${code}`);
            this.onDisconnected?.();

            // cleanup();

            if (this.#retryCount < OpenVpnTunnel.MAX_RETRIES) {
                this.#retryCount++;
                OpenVpnTunnel.logger.log(`🔁 Reconnecting in ${OpenVpnTunnel.RECONNECT_DELAY}ms...`);

                setTimeout(() => {
                    this.startVPN();
                }, OpenVpnTunnel.RECONNECT_DELAY);
            } else {
                OpenVpnTunnel.logger.log("🛑 Max retries reached. Stopping.");
            }
        });

        this.#vpnProcess.on("error", (err) => {
            this.#deleteAuthFile();
            OpenVpnTunnel.logger.error("❌ Failed to start VPN process:", err);
        });
    }
}