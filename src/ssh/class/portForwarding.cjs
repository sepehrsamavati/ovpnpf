module.exports = class {
	constructor(forward){
		forward.listen ||= false;
		forward.localPort ??= 8080;
		forward.destinationAddress ||= 'localhost';
		forward.remotePort ||= '8080';
		this.param = `-L ${forward.listen ? `${forward.listen}:` : ''}${forward.localPort}:${forward.destinationAddress}:${forward.remotePort}`;
	}
};