const { app, BrowserWindow, ipcMain, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let fullscreenWindow = null;

const APP_ID = 'xyz.vexikoff.parnasocial';
const APP_NAME = 'Parnasocial';
const PRELOAD_PATH = path.join(__dirname, 'preload.js');
const INDEX_PATH = path.join(__dirname, 'public', 'index.html');
const FULLSCREEN_PATH = path.join(__dirname, 'public', 'fullscreen.html');
const ICON_PATH = path.join(__dirname, 'assets', 'Parnasocial.ico');
const WINDOW_CONTROLS_HEIGHT = 36;

const AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma'];
const VIDEO_EXTS = ['.mp4', '.webm', '.mkv', '.mov', '.avi'];

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
    const sender = BrowserWindow.fromWebContents(event.sender);

    if (sender !== mainWindow && sender !== fullscreenWindow) {
        return null;
    }

    if (!sender || sender.isDestroyed()) {
        return null;
    }

    if (!event.senderFrame) {
        return null;
    }

    const frameUrl = stripHash(event.senderFrame.url);
    const windowUrl = stripHash(sender.webContents.getURL());

    if (frameUrl && windowUrl && frameUrl !== windowUrl) {
        return null;
    }

    return sender;
}

function sendMaximizedState(window) {
    if (!window || window.isDestroyed()) {
        return;
    }

    window.webContents.send('parnasocial:window:maximized', window.isMaximized());
}

function getMediaType(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (AUDIO_EXTS.includes(ext)) {
        return 'audio';
    }

    if (VIDEO_EXTS.includes(ext)) {
        return 'video';
    }

    return 'file';
}

function readDirectory(dirPath) {
    const entries = [];

    try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);

            if (item.isDirectory()) {
                entries.push({
                    name: item.name,
                    path: fullPath,
                    type: 'folder',
                    children: readDirectory(fullPath)
                });
            } else if (item.isFile()) {
                entries.push({
                    name: item.name,
                    path: fullPath,
                    type: getMediaType(fullPath)
                });
            }
        }
    } catch (error) {
        return entries;
    }

    return entries;
}

function createFullscreenWindow() {
    if (fullscreenWindow && !fullscreenWindow.isDestroyed()) {
        fullscreenWindow.focus();
        return;
    }

    fullscreenWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        show: false,
        title: APP_NAME,
        icon: ICON_PATH,
        backgroundColor: '#000000',
        thickFrame: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#101010',
            symbolColor: '#FFFFFF',
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

    fullscreenWindow.setMenu(null);

    fullscreenWindow.once('ready-to-show', () => {
        fullscreenWindow.show();
        sendMaximizedState(fullscreenWindow);
    });

    fullscreenWindow.on('maximize', () => {
        sendMaximizedState(fullscreenWindow);
    });

    fullscreenWindow.on('unmaximize', () => {
        sendMaximizedState(fullscreenWindow);
    });

    fullscreenWindow.on('closed', () => {
        fullscreenWindow = null;
    });

    fullscreenWindow.webContents.setWindowOpenHandler(() => {
        return { action: 'deny' };
    });

    fullscreenWindow.webContents.on('will-navigate', (event, url) => {
        const currentUrl = stripHash(fullscreenWindow.webContents.getURL());
        const targetUrl = stripHash(url);

        if (!currentUrl || currentUrl !== targetUrl) {
            event.preventDefault();
        }
    });

    fullscreenWindow.loadFile(FULLSCREEN_PATH).catch(() => {
        if (fullscreenWindow && !fullscreenWindow.isDestroyed()) {
            fullscreenWindow.close();
        }
    });
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

    ipcMain.handle('parnasocial:folder:open', async (event) => {
        const window = getTrustedWindow(event);

        if (!window) {
            return null;
        }

        const result = await dialog.showOpenDialog(window, {
            properties: ['openDirectory']
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    });

    ipcMain.handle('parnasocial:folder:read', (event, dirPath) => {
        const window = getTrustedWindow(event);

        if (!window) {
            return null;
        }

        if (typeof dirPath !== 'string' || dirPath === '') {
            return [];
        }

        return readDirectory(dirPath);
    });

    ipcMain.handle('parnasocial:folder:openFiles', async (event) => {
        const window = getTrustedWindow(event);

        if (!window) {
            return [];
        }

        const result = await dialog.showOpenDialog(window, {
            properties: ['openFile', 'multiSelections'],
            filters: [
                {
                    name: 'Media',
                    extensions: AUDIO_EXTS.map((e) => e.slice(1)).concat(VIDEO_EXTS.map((e) => e.slice(1)))
                }
            ]
        });

        if (result.canceled) {
            return [];
        }

        return result.filePaths;
    });

    ipcMain.on('parnasocial:fullscreen:open', (event) => {
        const window = getTrustedWindow(event);

        if (!window) {
            return;
        }

        createFullscreenWindow();
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
    const window = getTrustedWindow(event);

    if (!window) {
        return;
    }

    if (theme === '1') {
        window.setTitleBarOverlay({
            color: '#101010',
            symbolColor: '#FFFFFF'
        });
    } else if (theme === '0') {
        window.setTitleBarOverlay({
            color: '#ffffff',
            symbolColor: '#101010'
        });
    }
});

app.on('window-all-closed', () => {
    app.quit();
});