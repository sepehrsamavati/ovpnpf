// @ts-check

import fs from "node:fs";
import path from "node:path";
import config from "../common/config.mjs";
import bulkFileDelete from "../util/bulkFileDelete.mjs";
import processOvpnUsage from "../util/processOvpnUsage.mjs";
import consoleWithTimestamp from "../common/consoleWithTimestamp.mjs";

try {
    const authFileRegex = /^ovpn-auth-\d+\.txt$/;
    const authFiles = fs.readdirSync(config.tempDir).filter(fileName => authFileRegex.test(fileName)).map(fileName => path.join(config.tempDir, fileName));

    bulkFileDelete("OpenVPN AUTH", authFiles);
} catch (err) {
    consoleWithTimestamp.error(err);
}

try {
    const {
        filePaths: statusFiles,
        totals: totalUsage,
    } = processOvpnUsage();

    bulkFileDelete("OpenVPN STATUS", statusFiles);

    const totalUsageFileContent = [
        "OpenVPN STATISTICS",
        "Updated," + new Date().toLocaleString('sv-SE'),
        "TUN/TAP read bytes," + totalUsage.tunRx,
        "TUN/TAP write bytes," + totalUsage.tunTx,
        "TCP/UDP read bytes," + totalUsage.netRx,
        "TCP/UDP write bytes," + totalUsage.netTx,
        "Auth read bytes,0",
        "END",
        "",
    ]
        .join('\n');

    fs.writeFileSync(path.join(config.tempDir, `ovpn-status-${Date.now()}-total.log`), totalUsageFileContent);
} catch (err) {
    consoleWithTimestamp.error(err);
}