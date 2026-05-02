// @ts-check

import path from "node:path";
import config from "./config.mjs";
import { Worker } from "node:worker_threads";
import OpenVpnTunnel from "./ovpn/OpenVpnTunnel.mjs";
import { setInterval, clearInterval } from "node:timers";

const __dirname = import.meta.dirname;
const SSH_PATH = path.join(__dirname, "ssh", "app.cjs");

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

const closeSsh = () => {
    isConnected = false;
    if (sshThread) {
        console.info('ℹ️ Terminating previous SSH and continue...');
        sshThread.removeAllListeners();
        sshThread.terminate().then(() => console.info('ℹ️ SSH terminated ✅')).catch(() => null);
        sshThread = null;
    }
};
const connectSsh = () => {
    closeSsh();

    sshThread = new Worker(SSH_PATH);

    sshThread.once("error", () => {
        isConnected = false;
        setConsoleTitle("SSH disconnected 🔴");
        connectSsh();
    });

    sshThread.on("message", message => {
        if (message === "connected") {
            isConnected = true;
            console.log("Connected ✅");
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
                }, 1e3);
        }
    });
};

const connectOvpn = async () => {
    closeSsh();

    if (ovpnTun) {
        ovpnTun.onDisconnected = null;
        console.info('ℹ️ Closing previous OVPN...');
        ovpnTun.terminateProcess();
        ovpnTun.dispose();
        console.info('ℹ️ OVPN closed ✅');
        await new Promise(r => setTimeout(r, 2e3));
    }

    ovpnTun ??= new OpenVpnTunnel({ autoRetry: false });

    ovpnTun.onConnected = () => {
        setConsoleTitle("OpenVPN connected, connecting SSH... 🔵");
        setTimeout(connectSsh, 2e3);
    };

    ovpnTun.onDisconnected = () => {
        closeSsh();
        setConsoleTitle("⚠️ OpenVPN disconnected 🔴");
        connectOvpn();
    };

    await ovpnTun.startVPN();
};

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key) => {
    // Ctrl + R
    if (key === '\x12') {
        setConsoleTitle("Reconnecting... 🔵");
        isConnected = false;
        console.clear();
        connectOvpn();
    }

    // Ctrl + C
    if (key === '\x03') {
        process.exit();
    }
});

connectOvpn();
