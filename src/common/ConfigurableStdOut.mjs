// @ts-check

export default class ConfigurableStdOut {

    /** @type {?(data:string)=>void} */
    #writer = null;

    /**
     * 
     * @param {string} data 
     */
    write(data) {
        this.#writer?.(data);
    }

    /**
     * 
     * @param {boolean} enabled 
     */
    set(enabled) {
        if (enabled)
            this.enable();
        else
            this.disable();
        return this;
    }

    enable() {
        this.#writer = data => {
            process.stdout.write(data);
        };
        return this;
    }

    disable() {
        this.#writer = null;
        return this;
    }

    get enabled() {
        return typeof this.#writer === "function";
    }
}
