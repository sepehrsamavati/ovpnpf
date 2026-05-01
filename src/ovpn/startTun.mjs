// @ts-check

import OpenVpnTunnel from './OpenVpnTunnel.mjs';

const tun = new OpenVpnTunnel();

await tun.startVPN();
