// @ts-check

import fs from "node:fs";
import path from "node:path";
import config from "../config.mjs";
import formatBytes from "../util/formatBytes.mjs";
import OpenVpnTunnel from "../ovpn/OpenVpnTunnel.mjs";

const files = fs.readdirSync(config.tempDir).filter(fileName => fileName.startsWith('ovpn-status-') && fileName.endsWith('.log')).map(fileName => path.join(config.tempDir, fileName));
const usages = files.map(filePath => OpenVpnTunnel.parseOpenVpnStatus(filePath));

const validUsages = usages.filter(item => item !== null);

const totals = validUsages.reduce((acc, u) => {
    acc.tunRx += u.tunRx;
    acc.tunTx += u.tunTx;
    acc.netRx += u.netRx;
    acc.netTx += u.netTx;
    acc.auth += u.auth;
    return acc;
}, {
    tunRx: 0,
    tunTx: 0,
    netRx: 0,
    netTx: 0,
    auth: 0
});

const summary = {
    "Tunnel Download": formatBytes(totals.tunRx),
    "Tunnel Upload": formatBytes(totals.tunTx),
    "Network Download": formatBytes(totals.netRx),
    "Network Upload": formatBytes(totals.netTx),
    "Active Connections": totals.auth
};

console.table(summary);
