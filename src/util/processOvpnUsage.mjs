// @ts-check

import fs from "node:fs";
import path from "node:path";
import config from "../common/config.mjs";
import OpenVpnTunnel from "../ovpn/OpenVpnTunnel.mjs";

export default function () {
    const filePaths = fs.readdirSync(config.tempDir).filter(fileName => fileName.startsWith('ovpn-status-') && fileName.endsWith('.log')).map(fileName => path.join(config.tempDir, fileName));
    const usages = filePaths.map(filePath => OpenVpnTunnel.parseOpenVpnStatus(filePath));

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

    return {
        totals,
        filePaths,
    };
};
