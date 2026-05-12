// @ts-check

import config from "../common/config.mjs";
import parseMigrationUri, { convertToOtpAuth } from "../util/parseMigrationUri.mjs";

console.log(
    convertToOtpAuth(
        await parseMigrationUri(
            config.openVpn.passwordOrOtpSecret
        )
    )
)
