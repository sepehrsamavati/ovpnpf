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
        dynamic?: IPortForwarding[];
    };
    verb: boolean;
    disable: boolean;
};
