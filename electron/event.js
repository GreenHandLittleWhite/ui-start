const { ipcMain } = require('electron');
const { exec } = require('child_process');

class Event {
    constructor(main) {
        this.main = main;
        this.init();
    }

    children = {};

    startShell = (e, script, filePath) => {
        let pathArr = filePath.split('/');
        pathArr.pop();
        const path = pathArr.join('/');
        this.run(script, path);
    };

    stopShell = (e, script) => {
        process.kill(this.children[script].pid);
    };

    init() {
        ipcMain.on('shell', this.startShell);
        ipcMain.on('stop', this.stopShell);
    }

    run(script, path) {
        const workerProcess = exec(`npm run ${script}`, { cwd: path });
        this.children[script] = workerProcess;

        workerProcess.stdout.on('data', data => {
            this.main.webContents.send('log', data);
        });

        workerProcess.stderr.on('data', data => {
            this.main.webContents.send('log', data);
        });

        workerProcess.on('error', error => {
            this.main.webContents.send('error', error);
        });

        workerProcess.on('close', (code, signal) => {
            this.main.webContents.send('close');
        });
    }
}

module.exports = Event;
