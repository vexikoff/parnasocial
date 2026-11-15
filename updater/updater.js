const { autoUpdater } = require('electron-updater');
const config = require('./config');
const { registerIpcHandlers } = require('./ipc-handlers');

let mainWindow = null;
let checkInterval = null;

function isWindowValid() {
    return mainWindow && !mainWindow.isDestroyed();
}

function initUpdater(window) {
    mainWindow = window;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
        if (isWindowValid()) {
            mainWindow.webContents.send('update-available', info.version);
        }
    });

    autoUpdater.on('error', (err) => {
        if (isWindowValid()) {
            mainWindow.webContents.send('update-error', err.message);
        }
    });

    autoUpdater.on('download-progress', (progressObj) => {
        if (isWindowValid()) {
            mainWindow.webContents.send('download-progress', progressObj.percent);
        }
    });

    autoUpdater.on('update-downloaded', () => {
        if (isWindowValid()) {
            mainWindow.webContents.send('update-downloaded');
        }
    });

    registerIpcHandlers(mainWindow);
}

function startPeriodicCheck() {
    if (checkInterval) {
        clearInterval(checkInterval);
    }
    checkInterval = setInterval(() => {
        autoUpdater.checkForUpdates().catch((err) => {
            if (isWindowValid()) {
                mainWindow.webContents.send('update-error', err.message);
            }
        });
    }, config.checkIntervalMs);
}

module.exports = { initUpdater, startPeriodicCheck };