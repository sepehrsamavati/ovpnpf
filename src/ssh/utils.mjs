// @ts-check

/**
 * Generates an SSH port forwarding or SOCKS5 parameter.
 * Only **one mode** is allowed per object: local, remote, or dynamic.
 *
 * @param {import("./type").IPortForwarding} tunnel Tunnel configuration
 * @param {'local'|'remote'|'dynamic'} type Type of forwarding
 */
function createTunnelParam(tunnel, type) {
    switch (type) {
        case 'local': {
            const localPort = tunnel.localPort ?? 8080;
            const remotePort = tunnel.remotePort ?? 8080;
            const destination = tunnel.destinationAddress ?? 'localhost';
            const listen = tunnel.listen ? `${tunnel.listen}:` : '';
            return `-L ${listen}${localPort}:${destination}:${remotePort}`;
        }
        case 'remote': {
            const remotePort = tunnel.remotePort ?? 8080;
            const localPort = tunnel.localPort ?? 8080;
            const destination = tunnel.destinationAddress ?? 'localhost';
            const listen = tunnel.listen ? `${tunnel.listen}:` : '';
            return `-R ${listen}${remotePort}:${destination}:${localPort}`;
        }
        case 'dynamic': {
            if (!tunnel.localPort) throw new Error('Dynamic forwarding requires a port');
            return `-D ${tunnel.localPort}`;
        }
        default:
            throw new Error(`Invalid forward type: ${type}`);
    }
}

/**
 * 
 * Generates SSH command parameters.
 * @param {import("./type").ISshTunnel} param 
 * @returns 
 */
export default function createSshParams({
    user,
    host = '127.0.0.1',
    sshPort = 22,
    exitOnFail = true,
    aliveInterval = 60,
    verb = true,
    tunnels,
}) {
    /** @type {string[]} */
    const params = ['-N', `-p ${sshPort}`, `-o ExitOnForwardFailure=${exitOnFail ? 'yes' : 'no'}`];

    if (verb) params.push('-v');
    if (aliveInterval) params.push(`-o ServerAliveInterval=${aliveInterval}`);

    tunnels.local?.forEach(tunnel => params.push(createTunnelParam(tunnel, "local")));
    tunnels.remote?.forEach(tunnel => params.push(createTunnelParam(tunnel, "remote")));
    tunnels.dynamic?.forEach(localPort => params.push(createTunnelParam({ destinationAddress: "", listen: "", remotePort: 0, localPort }, "dynamic")));

    params.push(`${user ? `${user}@` : ''}${host}`);

    return params;
}
