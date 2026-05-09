#!/usr/bin/env bash

# Always switch to this script's directory
cd "$(dirname "$0")"

# Check root
if [ "$EUID" -ne 0 ]; then
    echo "Re-running with sudo..."
    exec sudo bash "$0" "$@"
fi

echo "Running as root"

# Keep terminal open and run script
node "./src/scripts/ovpnWithSsh.mjs"

echo
echo "Process exited. Press Enter to close..."
read