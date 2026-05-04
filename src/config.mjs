// @ts-check
import fs from "node:fs";
import timers from "node:timers";
import { parentPort } from "node:worker_threads";
import { isValidPort } from "./util/validations.mjs";
import { assertBoolean, assertNumber, assertObject, assertString } from "./util/asserts.mjs";

/**
 * @typedef {import("./types/config").IAppConfig} IAppConfig
 */

/**
 * @param {IAppConfig} cfg
 */
function validateConfig(cfg) {
    assertObject(cfg, "config");

    // root
    assertString(cfg.tempDir, "tempDir");

    // openVpn
    assertObject(cfg.openVpn, "openVpn");
    const ov = cfg.openVpn;

    assertString(ov.executablePath, "openVpn.executablePath");
    assertString(ov.username, "openVpn.username");
    assertString(ov.passwordOrOtpSecret, "openVpn.passwordOrOtpSecret");
    assertString(ov.configFullPath, "openVpn.configFullPath");
    assertNumber(ov.shaper, "openVpn.shaper");
    assertBoolean(ov.showOutput, "openVpn.showOutput");

    // small sanity checks
    if (ov.shaper < 0) {
        throw new Error(`"openVpn.shaper" cannot be negative`);
    }

    // detect otpauth vs password (optional but useful)
    if (
        ov.passwordOrOtpSecret.startsWith("otpauth://") === false &&
        ov.passwordOrOtpSecret.length < 3
    ) {
        throw new Error(
            `"openVpn.passwordOrOtpSecret" looks invalid (too short and not otpauth)`
        );
    }

    // optional: file existence checks (you probably want this)
    if (!fs.existsSync(ov.executablePath)) {
        throw new Error(`OpenVPN executable not found at "${ov.executablePath}"`);
    }

    if (!fs.existsSync(ov.configFullPath)) {
        throw new Error(`OpenVPN config not found at "${ov.configFullPath}"`);
    }

    // trafficUsage
    assertObject(ov.trafficUsage, "openVpn.trafficUsage");
    assertBoolean(ov.trafficUsage.monitor, "openVpn.trafficUsage.monitor");
    assertBoolean(ov.trafficUsage.keepLog, "openVpn.trafficUsage.keepLog");

    // ssh
    assertObject(cfg.ssh, "ssh");
    const ssh = cfg.ssh;

    assertString(ssh.username, "ssh.username");
    assertString(ssh.hostname, "ssh.hostname");
    assertNumber(ssh.port, "ssh.port");
    assertNumber(ssh.localPort, "ssh.localPort");
    assertString(ssh.localInterface, "ssh.localInterface");
    assertString(ssh.destinationAddress, "ssh.destinationAddress");
    assertNumber(ssh.remotePort, "ssh.remotePort");
    assertNumber(ssh.retryDelay, "ssh.retryDelay");
    assertBoolean(ssh.showOutput, "ssh.showOutput");

    if (!isValidPort(ssh.port)) {
        throw new Error(`Invalid "ssh.port"`);
    }

    if (!isValidPort(ssh.localPort)) {
        throw new Error(`Invalid "ssh.localPort"`);
    }

    if (!isValidPort(ssh.remotePort)) {
        throw new Error(`Invalid "ssh.remotePort"`);
    }

    if (ssh.retryDelay < 0) {
        throw new Error(`"ssh.retryDelay" cannot be negative`);
    }
}

const configFilePath = "./cfg.json";
/** @type {IAppConfig} */
let _config = JSON.parse(fs.readFileSync(configFilePath).toString());
const logger = parentPort === null ? console : null; // no logger in threads

/** @type {IAppConfig} */
const config = new Proxy(/** @type {IAppConfig} */({}), {
    get(_, prop) {
        return _config[/** @type {keyof IAppConfig} */ (prop)];
    },
    set(_, prop, value) {
        _config[/** @type {keyof IAppConfig} */ (prop)] = value;
        return true;
    },
    has(_, prop) {
        return prop in _config;
    },
    ownKeys() {
        return Reflect.ownKeys(_config);
    },
    getOwnPropertyDescriptor(_, prop) {
        return Object.getOwnPropertyDescriptor(_config, prop);
    }
});

/** @type {Set<() => void>} */
const configChangeListeners = new Set();

// run validation once at startup
validateConfig(_config);

fs.mkdirSync(_config.tempDir, { recursive: true });

/** @type {?NodeJS.Timeout} */
let timeout = null;
fs.watch(configFilePath, (eventType) => {

    if (eventType !== "change") return;

    if (timeout)
        timers.clearTimeout(timeout);

    timeout = timers.setTimeout(() => {
        try {
            const updated = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
            validateConfig(updated);
            _config = updated;
            configChangeListeners.forEach(cb => cb());
            logger?.log("Config reloaded & valid");
        } catch (err) {
            logger?.error("Invalid config update:", err instanceof Error ? err.message : err);
        }
    }, 300);
});

/**
 * 
 * @param {() => void} cb 
 */
export const addConfigChangeListener = (cb) => {
    configChangeListeners.add(cb);
};

export default config;