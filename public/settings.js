const SETTINGS_KEY = 'parnasocial:settings';

const settingsDefaults = {
    startWithWindows: false,
    savePlaylist: true,
    keepInTray: true,
    crossfade: false,
    videoPreview: false,
    autoRatio: false,
    vizualizator: false,
    bassBoost: false,
    discordRpc: false
};

let settingsStore = Object.assign({}, settingsDefaults);

try {
    const settingsRaw = localStorage.getItem(SETTINGS_KEY);

    if (settingsRaw) {
        const parsedSettings = JSON.parse(settingsRaw);

        for (const key of Object.keys(settingsDefaults)) {
            if (typeof parsedSettings[key] === typeof settingsDefaults[key]) {
                settingsStore[key] = parsedSettings[key];
            }
        }
    }
} catch (error) {
}

function persistSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsStore));
    } catch (error) {
    }
}

window.pSettings = {
    get: (key) => settingsStore[key],
    set: (key, value) => {
        if (!(key in settingsStore)) {
            return;
        }

        if (settingsStore[key] === value) {
            return;
        }

        settingsStore[key] = value;
        persistSettings();
        window.dispatchEvent(new CustomEvent('parnasocial:settings', { detail: key }));
    }
};

const startSwitch = document.querySelector('.switchsss input[type="checkbox"]');
const saveTraySwitches = document.querySelectorAll('.switchccc input[type="checkbox"]');
const saveSwitch = saveTraySwitches[0];
const traySwitch = saveTraySwitches[1];
const crossfadeSwitch = document.querySelector('.switchcc input[type="checkbox"]');
const previewSwitch = document.querySelector('.switchsssss input[type="checkbox"]');
const ratioSwitch = document.querySelector('.switchssssss input[type="checkbox"]');
const vizSwitch = document.querySelector('.switchccccc input[type="checkbox"]');
const bassSwitch = document.querySelector('.bassc input[type="checkbox"]');
const rpcSwitch = document.querySelector('.rpc input[type="checkbox"]');

function syncRatioDisabled() {
    if (ratioSwitch) {
        ratioSwitch.disabled = !settingsStore.videoPreview;
    }
}

if (startSwitch) {
    startSwitch.checked = settingsStore.startWithWindows;
}

if (saveSwitch) {
    saveSwitch.checked = settingsStore.savePlaylist;
}

if (traySwitch) {
    traySwitch.checked = settingsStore.keepInTray;
}

if (crossfadeSwitch) {
    crossfadeSwitch.checked = settingsStore.crossfade;
}

if (previewSwitch) {
    previewSwitch.checked = settingsStore.videoPreview;
}

if (ratioSwitch) {
    ratioSwitch.checked = settingsStore.autoRatio;
}

if (vizSwitch) {
    vizSwitch.checked = settingsStore.vizualizator;
}

if (bassSwitch) {
    bassSwitch.checked = settingsStore.bassBoost;
}

if (rpcSwitch) {
    rpcSwitch.checked = settingsStore.discordRpc;
}

syncRatioDisabled();

if (startSwitch) {
    startSwitch.addEventListener('change', async () => {
        const value = startSwitch.checked;

        window.pSettings.set('startWithWindows', value);

        if (window.parnasocial && window.parnasocial.settings && typeof window.parnasocial.settings.setAutostart === 'function') {
            const ok = await window.parnasocial.settings.setAutostart(value);

            if (!ok) {
                startSwitch.checked = !value;
                window.pSettings.set('startWithWindows', !value);
            }
        }
    });
}

if (saveSwitch) {
    saveSwitch.addEventListener('change', () => {
        window.pSettings.set('savePlaylist', saveSwitch.checked);
    });
}

if (traySwitch) {
    traySwitch.addEventListener('change', () => {
        window.pSettings.set('keepInTray', traySwitch.checked);

        if (window.parnasocial && window.parnasocial.settings && typeof window.parnasocial.settings.setTray === 'function') {
            window.parnasocial.settings.setTray(traySwitch.checked);
        }
    });
}

if (crossfadeSwitch) {
    crossfadeSwitch.addEventListener('change', () => {
        window.pSettings.set('crossfade', crossfadeSwitch.checked);
    });
}

if (previewSwitch) {
    previewSwitch.addEventListener('change', () => {
        window.pSettings.set('videoPreview', previewSwitch.checked);
        syncRatioDisabled();
    });
}

if (ratioSwitch) {
    ratioSwitch.addEventListener('change', () => {
        window.pSettings.set('autoRatio', ratioSwitch.checked);
    });
}

if (vizSwitch) {
    vizSwitch.addEventListener('change', () => {
        window.pSettings.set('vizualizator', vizSwitch.checked);
    });
}

if (bassSwitch) {
    bassSwitch.addEventListener('change', () => {
        window.pSettings.set('bassBoost', bassSwitch.checked);
    });
}

if (rpcSwitch) {
    rpcSwitch.addEventListener('change', () => {
        window.pSettings.set('discordRpc', rpcSwitch.checked);
    });
}

(async () => {
    if (!window.parnasocial || !window.parnasocial.settings) {
        return;
    }

    if (typeof window.parnasocial.settings.setTray === 'function') {
        window.parnasocial.settings.setTray(settingsStore.keepInTray);
    }

    if (typeof window.parnasocial.settings.getAutostart === 'function') {
        try {
            const real = await window.parnasocial.settings.getAutostart();

            if (typeof real === 'boolean' && real !== settingsStore.startWithWindows) {
                settingsStore.startWithWindows = real;
                persistSettings();

                if (startSwitch) {
                    startSwitch.checked = real;
                }
            }
        } catch (error) {
        }
    }
})();