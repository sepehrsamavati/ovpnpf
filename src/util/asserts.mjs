// @ts-check

/**
 * @param {unknown} value
 * @param {string} path
 */
export function assertString(value, path) {
    if (typeof value !== "string" || value.length === 0) {
        throw new Error(`Invalid "${path}" (expected non-empty string)`);
    }
}

/**
 * @param {unknown} value
 * @param {string} path
 */
export function assertNumber(value, path) {
    if (typeof value !== "number" || Number.isNaN(value)) {
        throw new Error(`Invalid "${path}" (expected number)`);
    }
}

/**
 * @param {unknown} value
 * @param {string} path
 */
export function assertBoolean(value, path) {
    if (typeof value !== "boolean") {
        throw new Error(`Invalid "${path}" (expected boolean)`);
    }
}

/**
 * @param {unknown} value
 * @param {string} path
 */
export function assertObject(value, path) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new Error(`Invalid "${path}" (expected object)`);
    }
}
