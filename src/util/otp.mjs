// @ts-check

import * as authenticator from 'otplib';
import { parseMigrationUri } from './parseMigrationUri.mjs';

/**
 * 
 * @param {string} otpAuth 
 * @returns 
 */
export async function generateCode(otpAuth) {

    if (otpAuth.startsWith("otpauth-migration://offline?data=")) {
        const extractedOtpAuth = (await parseMigrationUri(otpAuth)).at(0);
        if (!extractedOtpAuth) throw new Error("Failed to decode 'OTP Auth Migration'.");
        otpAuth = extractedOtpAuth;
    }

    // Parse the URL
    const url = new URL(otpAuth);

    // Extract parameters
    const secret = url.searchParams.get('secret');
    const digits = url.searchParams.get('digits');
    const period = url.searchParams.get('period');
    const algorithm = url.searchParams.get('algorithm');

    if (!secret) throw new Error("No secret!");

    const token = await authenticator.generate({
        secret: secret,
        digits: digits ? parseInt(digits) : 6,
        period: period ? parseInt(period) : 30,
        algorithm: algorithm ? /** @type {authenticator.HashAlgorithm} */ (algorithm.toLowerCase()) : 'sha1',
    });

    return token;
}
