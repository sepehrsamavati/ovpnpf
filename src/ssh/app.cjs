// @ts-check

const tunnels = require("./tunnels.cjs");
const Tunnel = require("./class/tunnel.cjs");
const { parentPort } = require("node:worker_threads");

const tunnelsRef = tunnels.filter(tunnel => !tunnel.disable).map(tunnel => new Tunnel(tunnel));

parentPort?.on("message", async (msg) => {
    if (msg === "shutdown") {

        for (const tunnel of tunnelsRef) {
            tunnel.destroy();
        }

        setTimeout(() => {
            process.exit(0);
        }, 1000).unref();
    }
});
