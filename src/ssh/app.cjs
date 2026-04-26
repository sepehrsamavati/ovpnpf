const Tunnel = require("./class/tunnel.cjs");
const tunnels = require("./tunnels.cjs");

const connections = tunnels.filter(tunnel => !tunnel.disable).map(tunnel => new Tunnel(tunnel));