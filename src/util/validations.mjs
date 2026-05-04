// @ts-check

/**
 * @description port sanity
 * @param {number} p 
 * @returns {boolean}
 */
export const isValidPort = (p) => Number.isInteger(p) && p >= 0 && p <= 65535;
