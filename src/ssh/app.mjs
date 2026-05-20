// @ts-check

import Connection from "./Connection.mjs";
import tunnels from "./tunnels.mjs";
import { parentPort } from "node:worker_threads";

const connectionsRef = tunnels.filter(tunnel => !tunnel.disable).map(tunnel => new Connection(tunnel));

parentPort?.on("message", async (msg) => {
    if (msg === "shutdown") {

        for (const connection of connectionsRef) {
            connection.destroy();
        }

        setTimeout(() => {
            process.exit(0);
        }, 1000).unref();
    }
});
