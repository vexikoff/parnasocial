const { ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

function isWindowValid(window) {
    return window && !window.isDestroyed();
}

function registerIpcHandlers(mainWindow) {
    ipcMain.on('start-update-check', () => {
        autoUpdater.checkForUpdates().catch((err) => {
            if (isWindowValid(mainWindow)) {
                mainWindow.webContents.send('update-error', err.message);
            }
        });
    });

    ipcMain.on('start-download', () => {
        autoUpdater.downloadUpdate().catch((err) => {
            if (isWindowValid(mainWindow)) {
                mainWindow.webContents.send('update-error', err.message);
            }
        });
    });

    ipcMain.on('quit-and-install', () => {
        autoUpdater.quitAndInstall(false, true);
    });
}

module.exports = { registerIpcHandlers };