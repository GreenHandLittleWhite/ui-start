const { ipcMain } = require('electron');

class Event {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;

        this.init();
    }

    startShell = (e, script) => {
        console.log(script);
    };

    init() {
        ipcMain.on('shell', this.startShell);
    }
}

module.exports = Event;
