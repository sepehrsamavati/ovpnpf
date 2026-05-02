// @ts-check

/**
 * 
 * @param {number} bytes 
 * @returns {string}
 */
export default function formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB", "TB"];

    let i = 0;
    let value = bytes;

    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }

    return `${value.toFixed(2)} ${units[i]}`;
}
