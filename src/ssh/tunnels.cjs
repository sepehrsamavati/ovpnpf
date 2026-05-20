// @ts-check

const { default: config } = require("../common/config.mjs");

/** @type {import("./type").ISshTunnel[]} */
const tunnels = [
	{
		name: "Bridge", // optional name for connection
		sshPort: config.ssh.port, // default 22
		user: config.ssh.username,
		host: config.ssh.hostname,
		aliveInterval: 20,
		exitOnFail: true,
		reconnect: true,
		verb: true,
		disable: false, // don't run this tunnel
		tunnels: {
			forward: [{
				localPort: config.ssh.localPort,
				remotePort: config.ssh.remotePort,
				listen: config.ssh.localInterface, // optional
				destinationAddress: config.ssh.destinationAddress,
			}]
		},
	}
];

module.exports = tunnels;