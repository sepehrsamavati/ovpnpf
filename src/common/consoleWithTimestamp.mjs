// @ts-check

/**
 * @typedef {typeof console} ConsoleType
 */

/** @type {ConsoleType} */
const consoleWithTimestamp = new Proxy(console, {
    get(target, prop, receiver) {
        const original = Reflect.get(target, prop, receiver);

        if (typeof original !== "function") {
            return original;
        }

        return (
            /**
             * @param {...unknown} args
             */
            function (...args) {
                // 👉 custom logic here
                const timestamp = new Date().toLocaleString();

                return original.call(target, `[${timestamp}]`, ...args);
            }
        );
    }
});

export default consoleWithTimestamp;