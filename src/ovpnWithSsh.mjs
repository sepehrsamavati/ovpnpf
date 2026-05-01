// @ts-check

import path from "node:path";
import { Worker } from "node:worker_threads";

const __dirname = import.meta.dirname;
const SSH_PATH = path.join(__dirname, "ssh", "app.cjs");
const OVPN_PATH = path.join(__dirname, "ovpn.mjs");

/**
 * 
 * @param {string} title 
 */
const setConsoleTitle = (title) => {
    process.stdout.write('\x1b]0;' + title + '\x07');
};

/** @type {Worker | null} */
let sshThread = null,
    /** @type {Worker | null} */
    ovpnThread = null;
const connectSsh = () => {

    if (sshThread) {
        console.info('ℹ️ Terminating previous SSH and continue...');
        sshThread.removeAllListeners();
        sshThread.terminate().then(() => console.info('ℹ️ SSH terminated ✅')).catch(() => null);
        sshThread = null;
    }

    sshThread = new Worker(SSH_PATH);

    sshThread.once("error", () => {
        setConsoleTitle("SSH disconnected 🔴");
        connectSsh();
    });

    sshThread.on("message", message => {
        if (message === "connected")
            setConsoleTitle("Connected ✅");
    });
};

const connectOvpn = async () => {

    if (ovpnThread) {
        console.info('ℹ️ Closing previous OVPN...');
        ovpnThread.removeAllListeners();
        await ovpnThread.postMessage("exit");
        console.info('ℹ️ OVPN closed ✅');
        await ovpnThread.terminate();
        ovpnThread = null;
        await new Promise(r => setTimeout(r, 2e3));
    }

    ovpnThread = new Worker(OVPN_PATH);

    ovpnThread.on("message", message => {
        switch (message) {
            case "connected":
                setConsoleTitle("OpenVPN connected, connecting SSH... 🔵");
                setTimeout(connectSsh, 2e3);
                break;
            case "disconnected":
                setConsoleTitle("⚠️ OpenVPN disconnected 🔴");
                break;
        }
    });
};

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key) => {
    // Ctrl + R
    if (key === '\x12') {
        setConsoleTitle("Reconnecting... 🔵");
        console.clear();
        connectOvpn();
    }

    // Ctrl + C
    if (key === '\x03') {
        process.exit();
    }
});

connectOvpn();
