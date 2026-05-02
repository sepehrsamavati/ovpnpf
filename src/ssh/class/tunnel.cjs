const { setTimeout } = require("node:timers");
const { spawn } = require('node:child_process');
const TunnelSession = require("./tunnelSession.cjs");
const { parentPort } = require("node:worker_threads");
const { default: config } = require('../../config.mjs');
const { default: ConfigurableStdOut } = require("../../common/ConfigurableStdOut.mjs");

let counter = 0;

module.exports = class {
	constructor(tunnel) {
		this.connected = false;
		this.number = ++counter;
		this.params = new TunnelSession(tunnel).params;
		this.reconnect = Boolean(tunnel.reconnect);
		this.name = tunnel.name ?? `SSH #${this.number}`;

		process.on("SIGINT", () => {
			if (this.cp)
				this.cp.kill();
		});

		this.#spawn();
	}
	stdout = new ConfigurableStdOut().set(config.ssh.showOutput);

	#spawn() {
		console.log(`Spawning ${this.name} SSH...`);
		this.cp = spawn("ssh", this.params);
		this.#initEvents();
	}

	#logger(data) {
		this.stdout.write(`${this.name} >_ `);
		this.stdout.write(data);
		if (!this.connected && data.toString().split('\n')[0].startsWith("debug1: Entering interactive session.")) {
			this.connected = true;
			parentPort?.postMessage("connected");
		}
	}

	#initEvents() {
		const cp = this.cp;

		cp.stderr.setEncoding('utf8');

		cp.stderr.on('data', data => this.#logger(data));
		cp.stdout.on('data', data => this.#logger(data));

		cp.on('exit', (code) => {
			console.log(`\n${this.name} tunnel exited with code ${code ?? "KILL"}`);

			if (code !== null && this.reconnect) {
				setTimeout(() => this.#spawn(), config.ssh.retryDelay);
			}
		});
	}
};