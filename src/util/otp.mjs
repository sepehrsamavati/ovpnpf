// @ts-check

import * as authenticator from 'otplib';
import parseMigrationUri from './parseMigrationUri.mjs';

/**
 * 
 * @param {string} otpAuth 
 * @returns 
 */
export async function generateCode(otpAuth) {

    /** @type {string} */
    let secret;
    let digits = 6;
    let period = 30;
    let algorithm = "sha1";
    /** @type {Awaited<ReturnType<typeof parseMigrationUri>>[number]?} */
    let extracted = null;

    if (otpAuth.startsWith("otpauth-migration://offline?data=")) {
        const extractedItems = await parseMigrationUri(otpAuth);
        if (extractedItems.length > 1) throw new Error("Multiple items detected in 'OTP Auth Migration' URI.");

        const extractedOtpAuth = extractedItems.at(0);
        if (!extractedOtpAuth) throw new Error("Failed to decode 'OTP Auth Migration'.");

        extracted = extractedOtpAuth;
    }

    if (extracted) {
        // MIGRATION FORMAT (object)
        secret = extracted.secret;
        digits = Number.parseInt(extracted.digits.toString());
        algorithm = extracted.algorithm;
        // issuer/name available if needed

    } else {
        // NORMAL OTPAUTH URL
        const url = new URL(otpAuth);

        secret = url.searchParams.get("secret") ?? "";
        digits = Number.parseInt(url.searchParams.get("digits") ?? digits.toString());
        period = Number.parseInt(url.searchParams.get("period") ?? period.toString());
        algorithm = url.searchParams.get("algorithm") || "sha1";

        if (!secret) throw new Error("No secret!");
    }

    if (!secret) throw new Error("No secret!");

    const token = await authenticator.generate({
        secret: secret,
        digits: digits,
        period: period,
        algorithm: algorithm ? /** @type {authenticator.HashAlgorithm} */ (algorithm.toLowerCase()) : 'sha1',
    });

    return token;
}
