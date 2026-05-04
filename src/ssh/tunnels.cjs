// @ts-check

const { default: config } = require("../common/config.mjs");

const tunnels = [
	{
		name: "Bridge", // optional name for connection
		sshPort: config.ssh.port, // default 22
		user: config.ssh.username,
		host: config.ssh.hostname,
		aliveInterval: 20,
		exitOnFail: true,
		reconnect: true,
		forward: { // use 'forwards' array for multiple forward
			localPort: config.ssh.localPort,
			remotePort: config.ssh.remotePort,
			listen: config.ssh.localInterface, // optional
			destinationAddress: config.ssh.destinationAddress,
		},
		verb: true,
		disable: false // don't run this tunnel
	}
];

module.exports = tunnels;