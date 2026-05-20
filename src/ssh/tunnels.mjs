// @ts-check

import config from "../common/config.mjs";

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
			local: [{
				localPort: config.ssh.localPort,
				remotePort: config.ssh.remotePort,
				listen: config.ssh.localInterface, // optional
				destinationAddress: config.ssh.destinationAddress,
			}],
			dynamic: config.ssh.socks5Port ? [{
				destinationAddress: "",
				listen: config.ssh.localInterface,
				localPort: config.ssh.socks5Port,
				remotePort: 0,
			}] : undefined
		},
	}
];

export default tunnels;
