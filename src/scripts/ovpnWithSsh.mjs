// @ts-check

import path from "node:path";
import config from "../common/config.mjs";
import { Worker } from "node:worker_threads";
import OpenVpnTunnel from "../ovpn/OpenVpnTunnel.mjs";
import { setInterval, clearInterval } from "node:timers";
import consoleWithTimestamp from "../common/consoleWithTimestamp.mjs";

const logger = consoleWithTimestamp;
const __dirname = import.meta.dirname;
const SSH_PATH = path.join(__dirname, "..", "ssh", "app.mjs");

/**
 * 
 * @param {string} title 
 */
const setConsoleTitle = (title) => {
    process.stdout.write('\x1b]0;' + title + '\x07');
};

/** @type {NodeJS.Timeout | null} */
let trafficMonitorTimer = null;
let isConnected = false;
const disposeTrafficMonitorTimer = () => {
    if (trafficMonitorTimer)
        clearInterval(trafficMonitorTimer);
    trafficMonitorTimer = null;
};

/** @type {Worker | null} */
let sshThread = null,
    /** @type {OpenVpnTunnel | null} */
    ovpnTun = null;

const closeSsh = async () => {
    isConnected = false;
    if (sshThread) {
        logger.info('ℹ️ Terminating previous SSH and continue...');

        sshThread.postMessage("shutdown");

        await new Promise(r => setTimeout(r, 1500));

        await sshThread.terminate();

        logger.info('ℹ️ SSH terminated ✅');

        sshThread.removeAllListeners();
        sshThread = null;
    }
};
const connectSsh = async () => {
    await closeSsh();

    sshThread = new Worker(SSH_PATH);

    sshThread.once("error", (err) => {
        console.log(err)
        isConnected = false;
        setConsoleTitle("SSH disconnected 🔴");
        connectSsh();
    });

    sshThread.on("message", message => {
        if (message === "connected") {
            isConnected = true;
            logger.log("Connected ✅");
            const title = "Connected ✅";
            setConsoleTitle(title);

            disposeTrafficMonitorTimer();

            if (config.openVpn.trafficUsage)
                trafficMonitorTimer = setInterval(() => {
                    if (!isConnected) {
                        disposeTrafficMonitorTimer();
                        return;
                    }

                    const usage = ovpnTun?.getVpnUsage();

                    if (usage)
                        setConsoleTitle(title + " | " + usage.total);
                }, config.openVpn.trafficUsage.updateInterval * 1e3).unref();
        }
    });
};

const connectOvpn = async () => {
    await closeSsh();

    if (ovpnTun) {
        ovpnTun.onDisconnected = null;
        logger.info('ℹ️ Closing previous OVPN...');
        ovpnTun.terminateProcess();
        ovpnTun.dispose();
        logger.info('ℹ️ OVPN closed ✅');
        await new Promise(r => setTimeout(r, 500));
    }

    ovpnTun ??= new OpenVpnTunnel({ autoRetry: false });

    ovpnTun.onConnected = () => {
        setConsoleTitle("OpenVPN connected, connecting SSH... 🔵");
        setTimeout(connectSsh, 2e3);
    };

    ovpnTun.onDisconnected = () => {
        setConsoleTitle("⚠️ OpenVPN disconnected 🔴");
        connectOvpn();
    };

    await ovpnTun.startVPN();
};

const reconnect = () => {
    setConsoleTitle("Reconnecting... 🔵");
    isConnected = false;
    logger.clear();
    connectOvpn();
};

// Auto reconnect
if (config.autoReconnect > 0.2)
    setInterval(reconnect, config.autoReconnect * 60e3).unref();

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key) => {
    // Ctrl + R
    if (key === '\x12') {
        reconnect();
    }

    // Ctrl + C
    if (key === '\x03') {
        process.exit();
    }
});

connectOvpn();
