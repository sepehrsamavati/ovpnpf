export type IPortTunneling = {
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
        forward?: IPortTunneling[];
        remote?: IPortTunneling[];
        /** Port number */
        dynamic?: IPortTunneling['localPort'][];
    };
    verb: boolean;
    disable: boolean;
};
