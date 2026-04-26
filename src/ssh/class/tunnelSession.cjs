const PortForwarding = require('./portForwarding.cjs');

module.exports = class {
	constructor({
		sshPort = 22,
		aliveInterval = 60,
		exitOnFail = true,
		forward,
		forwards = [],
		user,
		host = "127.0.0.1",
		verb = true,
	}){
		if(forward)
			forwards.push(forward);

		const portForwardings = forwards.map(forward => new PortForwarding(forward).param);

		const params = ["-N", `-p ${sshPort}`, `-o ExitOnForwardFailure=${exitOnFail ? 'yes' : 'no'}`];

		if(verb)
			params.push("-v");
		if(aliveInterval)
			params.push(`-o ServerAliveInterval=${aliveInterval}`);

		portForwardings.forEach(pf => params.push(pf));

		params.push(`${user ? `${user}@` : ''}${host}`);

		this.params = params;
	}
};