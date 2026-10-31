const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow = null;

const APP_ID = 'xyz.vexikoff.parnasocial';
const APP_NAME = 'Parnasocial';
const PRELOAD_PATH = path.join(__dirname, 'preload.js');
const INDEX_PATH = path.join(__dirname, 'public', 'fullscreen.html');
const ICON_PATH = path.join(__dirname, 'assets', 'Parnasocial.ico');
const WINDOW_CONTROLS_HEIGHT = 36;

const ALLOWED_PERMISSIONS = new Set([
    'clipboard-read',
    'clipboard-sanitized-write'
]);

function stripHash(url) {
    const hashIndex = url.indexOf('#');

    if (hashIndex === -1) {
        return url;
    }

    return url.slice(0, hashIndex);
}

function getTrustedWindow(event) {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return null;
    }

    const window = BrowserWindow.fromWebContents(event.sender);

    if (window !== mainWindow) {
        return null;
    }

    if (!event.senderFrame) {
        return null;
    }

    const frameUrl = stripHash(event.senderFrame.url);
    const windowUrl = stripHash(mainWindow.webContents.getURL());

    if (frameUrl && windowUrl && frameUrl !== windowUrl) {
        return null;
    }

    return window;
}

function sendMaximizedState(window) {
    if (!window || window.isDestroyed()) {
        return;
    }

    window.webContents.send('parnasocial:window:maximized', window.isMaximized());
}

function registerIpc() {
    ipcMain.handle('parnasocial:app:getInfo', (event) => {
        const window = getTrustedWindow(event);

        if (!window) {
            return null;
        }

        return {
            appId: APP_ID,
            appName: APP_NAME,
            platform: process.platform,
            arch: process.arch,
            appVersion: app.getVersion(),
            electronVersion: process.versions.electron,
            chromeVersion: process.versions.chrome,
            nodeVersion: process.versions.node,
            windowControlsHeight: WINDOW_CONTROLS_HEIGHT
        };
    });

    ipcMain.handle('parnasocial:window:minimize', (event) => {
        const window = getTrustedWindow(event);

        if (window && window.isMinimizable()) {
            window.minimize();
        }

        return null;
    });

    ipcMain.handle('parnasocial:window:toggleMaximize', (event) => {
        const window = getTrustedWindow(event);

        if (!window || !window.isMaximizable()) {
            return false;
        }

        if (window.isMaximized()) {
            window.unmaximize();
        } else {
            window.maximize();
        }

        return window.isMaximized();
    });

    ipcMain.handle('parnasocial:window:close', (event) => {
        const window = getTrustedWindow(event);

        if (window) {
            window.close();
        }

        return null;
    });

    ipcMain.handle('parnasocial:window:isMaximized', (event) => {
        const window = getTrustedWindow(event);

        if (!window) {
            return false;
        }

        return window.isMaximized();
    });
}

function getWindowsSystemUsername() {
    let username = '';

    if (typeof process.env.USERNAME === 'string') {
        username = process.env.USERNAME.trim();
    }

    if (username === '' && typeof process.env.USER === 'string') {
        username = process.env.USER.trim();
    }

    if (username === '') {
        username = 'Пользователь';
    }

    return username;
}

ipcMain.handle('system:get-windows-username', () => {
    return getWindowsSystemUsername();
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        show: false,
        title: APP_NAME,
        icon: ICON_PATH,
        backgroundColor: '#ffffff',
        thickFrame: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#ffffff',
            symbolColor: '#101010',
            height: WINDOW_CONTROLS_HEIGHT
        },
        webPreferences: {
            preload: PRELOAD_PATH,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
            spellcheck: false,
            devTools: !app.isPackaged
        }
    });

    mainWindow.setMenu(null);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        sendMaximizedState(mainWindow);
    });

    mainWindow.on('maximize', () => {
        sendMaximizedState(mainWindow);
    });

    mainWindow.on('unmaximize', () => {
        sendMaximizedState(mainWindow);
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.webContents.setWindowOpenHandler(() => {
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        const currentUrl = stripHash(mainWindow.webContents.getURL());
        const targetUrl = stripHash(url);

        if (!currentUrl || currentUrl !== targetUrl) {
            event.preventDefault();
        }
    });

    mainWindow.webContents.on('will-attach-webview', (event) => {
        event.preventDefault();
    });

    mainWindow.loadFile(INDEX_PATH).catch(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.close();
        }
    });
}

if (process.platform !== 'win32') {
    app.quit();
} else {
    app.setName(APP_NAME);
    app.setAppUserModelId(APP_ID);
    app.enableSandbox();

    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
        app.quit();
    } else {
        app.on('second-instance', () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }

                mainWindow.focus();
            }
        });

        app.whenReady().then(() => {
            session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
                callback(ALLOWED_PERMISSIONS.has(permission));
            });

            session.defaultSession.setPermissionCheckHandler((details) => {
                return ALLOWED_PERMISSIONS.has(details.permission);
            });

            registerIpc();
            createWindow();

            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    createWindow();
                }
            });
        });
    }
}

ipcMain.on('themechang', (event, theme) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    if (theme === '1') {
        mainWindow.setTitleBarOverlay({
            color: '#101010',
            symbolColor: '#FFFFFF'
        });
    } else if (theme === '0') {
        mainWindow.setTitleBarOverlay({
            color: '#ffffff',
            symbolColor: '#101010'
        });
    }
});

app.on('window-all-closed', () => {
    app.quit();
});