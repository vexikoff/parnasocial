const { app, BrowserWindow, ipcMain, session, dialog, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let fullscreenWindow = null;
let tray = null;
let keepInTray = false;
let forceQuit = false;

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

function isAllowedRendererUrl(url) {
    const lower = stripHash(url).toLowerCase();
    return lower.endsWith('/public/index.html') || lower.endsWith('/public/fullscreen.html');
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

function decodeId3Text(body) {
    if (!body || body.length === 0) {
        return '';
    }

    const encoding = body[0];
    let raw = body.slice(1);
    let text = '';

    if (encoding === 1) {
        if (raw.length >= 2 && raw[0] === 0xFE && raw[1] === 0xFF) {
            const swapped = Buffer.alloc(raw.length);

            for (let i = 0; i < raw.length; i++) {
                swapped[i] = raw[i ^ 1];
            }

            text = swapped.slice(2).toString('utf16le');
        } else {
            text = raw.toString('utf16le');
        }
    } else if (encoding === 2) {
        text = raw.toString('utf16le');
    } else if (encoding === 3) {
        text = raw.toString('utf8');
    } else {
        text = raw.toString('latin1');
    }

    return text.replace(/\uFEFF/g, '').replace(/\0+$/g, '').trim();
}

function parseApic(body) {
    let pos = 0;
    const encoding = body[pos];
    pos++;

    let mime = '';

    while (pos < body.length && body[pos] !== 0) {
        mime += String.fromCharCode(body[pos]);
        pos++;
    }

    pos++;
    pos++;

    if (encoding === 1 || encoding === 2) {
        while (pos + 1 < body.length && !(body[pos] === 0 && body[pos + 1] === 0)) {
            pos += 2;
        }

        pos += 2;
    } else {
        while (pos < body.length && body[pos] !== 0) {
            pos++;
        }

        pos++;
    }

    const data = body.slice(pos);

    return {
        mime: mime || 'image/jpeg',
        base64: data.toString('base64')
    };
}

function parseId3Tag(tag, version) {
    const result = {
        title: '',
        artist: '',
        pictureMime: '',
        pictureBase64: ''
    };

    let pos = 0;

    while (pos + 10 <= tag.length) {
        const id = tag.toString('latin1', pos, pos + 4);

        if (id === '\0\0\0\0') {
            break;
        }

        let size;

        if (version === 4) {
            size = ((tag[pos + 4] & 0x7f) << 21) | ((tag[pos + 5] & 0x7f) << 14) | ((tag[pos + 6] & 0x7f) << 7) | (tag[pos + 7] & 0x7f);
        } else {
            size = tag.readUInt32BE(pos + 4);
        }

        const bodyStart = pos + 10;

        if (size <= 0 || bodyStart + size > tag.length) {
            break;
        }

        const body = tag.slice(bodyStart, bodyStart + size);

        if (id === 'TIT2') {
            result.title = decodeId3Text(body);
        } else if (id === 'TPE1') {
            result.artist = decodeId3Text(body);
        } else if (id === 'APIC' && !result.pictureBase64) {
            const pic = parseApic(body);
            result.pictureMime = pic.mime;
            result.pictureBase64 = pic.base64;
        }

        pos = bodyStart + size;
    }

    return result;
}

function readId3Metadata(filePath) {
    try {
        const fd = fs.openSync(filePath, 'r');
        const header = Buffer.alloc(10);
        const readCount = fs.readSync(fd, header, 0, 10, 0);

        if (readCount < 10 || header.toString('latin1', 0, 3) !== 'ID3') {
            fs.closeSync(fd);
            return null;
        }

        const version = header[3];
        const size = ((header[6] & 0x7f) << 21) | ((header[7] & 0x7f) << 14) | ((header[8] & 0x7f) << 7) | (header[9] & 0x7f);

        if (size <= 0 || size > 32 * 1024 * 1024) {
            fs.closeSync(fd);
            return null;
        }

        const tag = Buffer.alloc(size);
        fs.readSync(fd, tag, 0, size, 10);
        fs.closeSync(fd);

        return parseId3Tag(tag, version);
    } catch (error) {
        return null;
    }
}

function showMainWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    mainWindow.show();
    mainWindow.focus();
}

function ensureTray() {
    if (tray) {
        return;
    }

    tray = new Tray(ICON_PATH);
    tray.setToolTip(APP_NAME);

    const menu = Menu.buildFromTemplate([
        {
            label: 'Show ' + APP_NAME,
            click: showMainWindow
        },
        {
            type: 'separator'
        },
        {
            label: 'Quit',
            click: () => {
                forceQuit = true;
                app.quit();
            }
        }
    ]);

    tray.on('click', showMainWindow);
    tray.setContextMenu(menu);
}

function destroyTray() {
    if (!tray) {
        return;
    }

    tray.destroy();
    tray = null;
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
        if (!isAllowedRendererUrl(url)) {
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

    ipcMain.handle('parnasocial:media:metadata', (event, filePath) => {
        const window = getTrustedWindow(event);

        if (!window) {
            return null;
        }

        if (typeof filePath !== 'string' || filePath === '') {
            return null;
        }

        return readId3Metadata(filePath);
    });

    ipcMain.handle('parnasocial:autostart:get', (event) => {
        const window = getTrustedWindow(event);

        if (!window) {
            return false;
        }

        try {
            return app.getLoginItemSettings().openAtLogin;
        } catch (error) {
            return false;
        }
    });

    ipcMain.handle('parnasocial:autostart:set', (event, value) => {
        const window = getTrustedWindow(event);

        if (!window) {
            return false;
        }

        try {
            app.setLoginItemSettings({ openAtLogin: value === true });
            return true;
        } catch (error) {
            return false;
        }
    });

    ipcMain.on('parnasocial:settings:tray', (event, value) => {
        const window = getTrustedWindow(event);

        if (!window) {
            return;
        }

        keepInTray = value === true;

        if (keepInTray) {
            ensureTray();
        } else {
            destroyTray();
        }
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

    mainWindow.on('close', (event) => {
        if (keepInTray && !forceQuit) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.webContents.setWindowOpenHandler(() => {
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!isAllowedRendererUrl(url)) {
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

                showMainWindow();
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

app.on('before-quit', () => {
    forceQuit = true;
});