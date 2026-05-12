const { setTimeout } = require("node:timers");
const { spawn } = require('node:child_process');
const TunnelSession = require("./tunnelSession.cjs");
const { parentPort } = require("node:worker_threads");
const { default: ConfigurableStdOut } = require("../../common/ConfigurableStdOut.mjs");
const { default: config, addConfigChangeListener } = require('../../common/config.mjs');
const { default: consoleWithTimestamp } = require("../../common/consoleWithTimestamp.mjs");

let counter = 0;

class Tunnel {
	static logger = consoleWithTimestamp;

	constructor(tunnel) {
		this.connected = false;
		this.number = ++counter;
		this.params = new TunnelSession(tunnel).params;
		this.reconnect = Boolean(tunnel.reconnect);
		this.name = tunnel.name ?? `SSH #${this.number}`;

		addConfigChangeListener(() => {
			this.stdout.set(config.ssh.showOutput);
		});

		// process.on("SIGINT", () => {
		// 	this.closing = true;
		// 	this.reconnect = false;
		// 	if (this.cp)
		// 		this.cp.kill();
		// });

		this.#spawn();
	}
	stdout = new ConfigurableStdOut().set(config.ssh.showOutput);
	closing = false;

	#spawn() {
		Tunnel.logger.log(`Spawning ${this.name} SSH...`);
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
			Tunnel.logger.log(`❌ ${this.name} tunnel exited with code ${code ?? "KILL"}`);

			if (!this.closing && code !== null && this.reconnect) {
				setTimeout(() => this.#spawn(), config.ssh.retryDelay);
			}
		});
	}

	destroy() {
		this.closing = true;

		if (this.cp && !this.cp.killed) {
			this.cp.removeAllListeners();

			try {
				this.cp.kill("SIGTERM");
			} catch { }

			setTimeout(() => {
				try {
					this.cp?.kill("SIGKILL");
				} catch { }
			}, 3000).unref();
		}
	}
};

module.exports = Tunnel;
