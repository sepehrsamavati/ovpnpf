export type IPortForwarding = {
    localPort: number;
    remotePort: number;
    listen: string;
    destinationAddress: string;
}

export type ISshTunnel = {
    name: string;
    sshPort: number;
    user: string;
    host: string;
    aliveInterval: number;
    exitOnFail: boolean;
    reconnect: boolean;
    tunnels: {
        local?: IPortForwarding[];
        remote?: IPortForwarding[];
        /** Port number */
        dynamic?: IPortForwarding['localPort'][];
    };
    verb: boolean;
    disable: boolean;
};
