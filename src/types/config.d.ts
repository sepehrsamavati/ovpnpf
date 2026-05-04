export type ITrafficUsageConfig = {
    monitor: boolean;
    keepLog: boolean;
}

export type IOpenVpnConfig = {
    executablePath: string;
    username: string;
    /**
     * Either a plain password or an otpauth URL
     */
    passwordOrOtpSecret: string;
    configFullPath: string;
    /**
     * Traffic shaping value (e.g. kbps). 0 = disabled
     */
    shaper: number;
    showOutput: boolean;
    trafficUsage: TrafficUsageConfig;
}

export type ISshConfig = {
    username: string;
    hostname: string;
    port: number;
    /**
     * Local forwarded port (0 = random)
     */
    localPort: number;
    /**
     * Usually "0.0.0.0" or "127.0.0.1"
     */
    localInterface: string;
    destinationAddress: string;
    remotePort: number;
    /**
     * Retry delay in milliseconds
     */
    retryDelay: number;
    showOutput: boolean;
}

export type IAppConfig = {
    tempDir: string;
    openVpn: OpenVpnConfig;
    ssh: SshConfig;
}