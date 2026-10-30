const { contextBridge, ipcRenderer } = require('electron');

function invoke(channel) {
    return ipcRenderer.invoke(channel);
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
        getInfo: () => invoke('parnasocial:app:getInfo')
    },
    window: {
        minimize: () => invoke('parnasocial:window:minimize'),
        toggleMaximize: () => invoke('parnasocial:window:toggleMaximize'),
        close: () => invoke('parnasocial:window:close'),
        isMaximized: () => invoke('parnasocial:window:isMaximized'),
        onMaximized: (callback) => subscribe('parnasocial:window:maximized', callback)
    }
};

Object.freeze(api.app);
Object.freeze(api.window);
Object.freeze(api);

contextBridge.exposeInMainWorld('parnasocial', {
    changeth: (theme) => ipcRenderer.send('themechang', theme),
    ...api,
    getWindowsUsername: () => {
        return ipcRenderer.invoke('system:get-windows-username');
    }
});