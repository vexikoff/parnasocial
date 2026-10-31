const { contextBridge, ipcRenderer } = require('electron');

function invoke(channel, ...args) {
    return ipcRenderer.invoke(channel, ...args);
}

function subscribe(channel, callback) {
    if (typeof callback !== 'function') {
        return () => {};
    }

    const listener = (event, value) => {
        callback(value);
    };

    ipcRenderer.on(channel, listener);

    return () => {
        ipcRenderer.removeListener(channel, listener);
    };
}

const api = {
    app: {
        getInfo: () => invoke('parnasocial:app:getInfo'),
        getPendingFile: () => invoke('parnasocial:app:getPendingFile'),
        onOpenFile: (callback) => subscribe('parnasocial:file:open', callback)
    },
    window: {
        minimize: () => invoke('parnasocial:window:minimize'),
        toggleMaximize: () => invoke('parnasocial:window:toggleMaximize'),
        close: () => invoke('parnasocial:window:close'),
        isMaximized: () => invoke('parnasocial:window:isMaximized'),
        onMaximized: (callback) => subscribe('parnasocial:window:maximized', callback),
        setFullScreen: (value) => invoke('parnasocial:window:setFullScreen', value),
        isFullScreen: () => invoke('parnasocial:window:isFullScreen'),
        onFullScreenState: (callback) => subscribe('parnasocial:window:fullscreenstate', callback)
    },
    folder: {
        open: () => invoke('parnasocial:folder:open'),
        read: (dirPath) => invoke('parnasocial:folder:read', dirPath),
        openFiles: () => invoke('parnasocial:folder:openFiles')
    },
    media: {
        getMetadata: (filePath) => invoke('parnasocial:media:metadata', filePath)
    },
    settings: {
        getAutostart: () => invoke('parnasocial:autostart:get'),
        setAutostart: (value) => invoke('parnasocial:autostart:set', value),
        setTray: (value) => ipcRenderer.send('parnasocial:settings:tray', value)
    },
    fullscreen: {
        open: () => ipcRenderer.send('parnasocial:fullscreen:open')
    }
};

Object.freeze(api.app);
Object.freeze(api.window);
Object.freeze(api.folder);
Object.freeze(api.media);
Object.freeze(api.settings);
Object.freeze(api.fullscreen);
Object.freeze(api);

contextBridge.exposeInMainWorld('parnasocial', {
    changeth: (theme) => ipcRenderer.send('themechang', theme),
    ...api,
    getWindowsUsername: () => {
        return ipcRenderer.invoke('system:get-windows-username');
    }
});