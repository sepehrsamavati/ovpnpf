// @ts-check

import * as authenticator from 'otplib';

/**
 * 
 * @param {string} otpAuth 
 * @returns 
 */
export async function generateCode(otpAuth) {

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
        step: period ? parseInt(period) : 30,
        // @ts-ignore
        algorithm: algorithm ? algorithm.toLowerCase() : 'sha1',
    });

    return token;
}
