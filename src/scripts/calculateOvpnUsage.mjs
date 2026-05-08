// @ts-check

import formatBytes from "../util/formatBytes.mjs";
import processOvpnUsage from "../util/processOvpnUsage.mjs";

const { totals } = processOvpnUsage();

const summary = {
    "Tunnel Download": formatBytes(totals.tunRx),
    "Tunnel Upload": formatBytes(totals.tunTx),
    "Network Download": formatBytes(totals.netRx),
    "Network Upload": formatBytes(totals.netTx),
    "Active Connections": totals.auth
};

console.table(summary);
