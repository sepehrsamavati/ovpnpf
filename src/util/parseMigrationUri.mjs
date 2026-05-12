// @ts-check

// Credit: https://github.com/taharactrl/otpauth-migration-parser

import path from "node:path";
import { base32 } from "rfc4648";
import protobuf from "protobufjs";
import { fileURLToPath } from "node:url";

/**
 * @typedef {{
 * secret: ArrayLike<number>;
 * name: string;
 * issuer: string;
 * algorithm: keyof typeof ALGORITHM;
 * digits: keyof typeof DIGIT_COUNT;
 * type: keyof typeof OTP_TYPE;
 * counter: number;
 * }} IOtpParameter
 * 
 * @typedef {{
 *   secret: string;
 *   name: string;
 *   issuer: string;
 *   algorithm: string;
 *   digits: string | number;
 *   type: string;
 *   counter: number;
 * }[]} DecodedItems
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALGORITHM = {
    0: "unspecified",
    1: "sha1",
    2: "sha256",
    3: "sha512",
    4: "md5",
};

const DIGIT_COUNT = {
    0: "unspecified",
    1: 6,
    2: 8,
};

const OTP_TYPE = {
    0: "unspecified",
    1: "hotp",
    2: "totp",
};

/**
 * Load protobuf schema
 *
 * @param {string} protoFilePath
 * @returns {Promise<protobuf.Root | undefined>}
 */
function protobufPromise(protoFilePath) {
    return new Promise((resolve, reject) => {
        protobuf.load(protoFilePath, (err, root) => {
            if (err) {
                return reject(err);
            }

            resolve(root);
        });
    });
}

/**
 * 
 * @param {DecodedItems} items 
 */
export function convertToOtpAuth(items) {
    console.log(
        items
            .map(item => {
                const url = new URL("otpauth://totp/" + encodeURIComponent(item.issuer + ":" + item.name));

                url.searchParams.set("period", "30");
                url.searchParams.set("digits", item.digits.toString());
                url.searchParams.set("algorithm", item.algorithm);
                url.searchParams.set("secret", item.secret);
                url.searchParams.set("issuer", item.issuer);

                return url.toString();
            })
    )
}

/**
 * Parse Google Authenticator migration URI
 *
 * @param {string} sourceUrl
 * @returns {Promise<DecodedItems>}
 */
export default async function parseMigrationUri(sourceUrl) {

    if (typeof sourceUrl !== "string") {
        throw new Error("source url must be a string");
    }

    if (!sourceUrl.startsWith("otpauth-migration://offline")) {
        throw new Error(
            "source url must begin with otpauth-migration://offline"
        );
    }

    const sourceData = new URL(sourceUrl).searchParams.get("data");

    if (!sourceData) {
        throw new Error("source url doesn't contain otpauth data");
    }

    const protobufRoot = await protobufPromise(
        path.join(__dirname, "..", "..", "otpauth-migration.proto")
    );

    if (!protobufRoot) {
        throw new Error("Couldn't load protobuf");
    }

    const migrationPayload =
        protobufRoot.lookupType("MigrationPayload");

    const normalized = sourceData
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const decodedOtpPayload = migrationPayload.decode(
        Buffer.from(normalized, "base64")
    );

    // @ts-ignore
    return decodedOtpPayload.otpParameters.map((/** @type {IOtpParameter} */ otpParameter) => ({
        secret: base32.stringify(otpParameter.secret),

        name: otpParameter.name,

        issuer: otpParameter.issuer,

        algorithm:
            ALGORITHM[otpParameter.algorithm]
            ?? "unknown",

        digits:
            DIGIT_COUNT[otpParameter.digits]
            ?? "unknown",

        type:
            OTP_TYPE[otpParameter.type]
            ?? "unknown",

        counter: otpParameter.counter,
    }));
}