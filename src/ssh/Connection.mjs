// @ts-check

import { setTimeout } from 'node:timers';
import createSshParams from './utils.mjs';
import { spawn } from 'node:child_process';
import { parentPort } from 'node:worker_threads';
import ConfigurableStdOut from '../common/ConfigurableStdOut.mjs';
import consoleWithTimestamp from '../common/consoleWithTimestamp.mjs';
import config, { addConfigChangeListener } from '../common/config.mjs';

let counter = 0;

export default class Connection {
    /** @type {typeof consoleWithTimestamp} */
    static logger = consoleWithTimestamp;

    /** @type {ConfigurableStdOut} */
    stdout = new ConfigurableStdOut().set(config.ssh.showOutput);

    /** @type {boolean} */
    connected = false;

    /** @type {boolean} */
    closing = false;

    /** @type {import('node:child_process').ChildProcessWithoutNullStreams?} */
    cp = null;

    /**
     * 
     * @param {import('./type').ISshTunnel} sshConnectionConfig 
     */
    constructor(sshConnectionConfig) {
        this.number = ++counter;
        this.params = createSshParams(sshConnectionConfig);
        this.reconnect = Boolean(sshConnectionConfig.reconnect);
        this.name = sshConnectionConfig.name ?? `SSH #${this.number}`;

        addConfigChangeListener(() => {
            this.stdout.set(config.ssh.showOutput);
        });

        // Uncomment if you want SIGINT handling in main thread
        // process.on("SIGINT", () => {
        //   this.closing = true;
        //   this.reconnect = false;
        //   if (this.cp)
        //     this.cp.kill();
        // });

        this.#spawn();
    }

    /**
     * Spawns the SSH process.
     */
    #spawn() {
        Connection.logger.log(`Spawning ${this.name} SSH...`);
        this.cp = spawn('ssh', this.params);
        this.#initEvents();
    }

    /**
     * Logs process output and detects connection establishment.
     * @param {Buffer|string} data Output from ssh process
     */
    #logger(data) {
        this.stdout.write(`${this.name} >_ `);
        this.stdout.write(data);

        if (
            !this.connected &&
            data.toString().split('\n')[0].startsWith('debug1: Entering interactive session.')
        ) {
            this.connected = true;
            parentPort?.postMessage('connected');
        }
    }

    /**
     * Initializes event handlers for the SSH child process.
     */
    #initEvents() {
        const cp = this.cp;

        cp?.stderr.setEncoding('utf8');

        cp?.stderr.on('data', (data) => this.#logger(data));
        cp?.stdout.on('data', (data) => this.#logger(data));

        cp?.on('exit', (code) => {
            Connection.logger.log(`❌ ${this.name} tunnel exited with code ${code ?? 'KILL'}`);

            if (!this.closing && code !== null && this.reconnect) {
                setTimeout(() => this.#spawn(), config.ssh.retryDelay);
            }
        });
    }

    /**
     * Destroys the tunnel and kills the SSH process.
     */
    destroy() {
        this.closing = true;

        if (this.cp && !this.cp.killed) {
            this.cp.removeAllListeners();

            try {
                this.cp.kill('SIGTERM');
            } catch { }

            setTimeout(() => {
                try {
                    this.cp?.kill('SIGKILL');
                } catch { }
            }, 3000).unref();
        }
    }
}