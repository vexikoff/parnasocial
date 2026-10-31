var yaebalneironki = localStorage.getItem('yaebalneironki');
const settings = document.querySelector('.settings');
const themeSwitch = document.querySelector('.switch input[type="checkbox"]');

if (yaebalneironki !== '0' && yaebalneironki !== '1') {
    yaebalneironki = '0';
}

function syncThemeToMain(theme) {
    if (!window.parnasocial || typeof window.parnasocial.changeth !== 'function') {
        return;
    }

    window.parnasocial.changeth(theme);
}

function aplittheme() {
    document.documentElement.setAttribute('data-theme', yaebalneironki);

    if (themeSwitch) {
        themeSwitch.checked = yaebalneironki === '1';
    }
}

function saveth(theme) {
    if (theme !== '0' && theme !== '1') {
        return;
    }

    yaebalneironki = theme;
    localStorage.setItem('yaebalneironki', yaebalneironki);
    aplittheme();
    syncThemeToMain(yaebalneironki);
}

function aplitheme() {
    if (yaebalneironki === '1') {
        saveth('0');
    } else {
        saveth('1');
    }
}

function getth() {
    return yaebalneironki;
}

function openset() {
    settings.classList.toggle('vniz');
}

function bindThemeSwitch() {
    if (!themeSwitch) {
        return;
    }

    themeSwitch.addEventListener('change', () => {
        saveth(themeSwitch.checked ? '1' : '0');
    });
}

aplittheme();
bindThemeSwitch();
syncThemeToMain(yaebalneironki);

async function adlf() {
    const nameHeading = document.getElementById('name');

    if (!nameHeading) {
        return;
    }

    if (!window.parnasocial || typeof window.parnasocial.getWindowsUsername !== 'function') {
        nameHeading.textContent = 'user';
        return;
    }

    try {
        const username = await window.parnasocial.getWindowsUsername();

        if (typeof username === 'string' && username.trim() !== '') {
            nameHeading.textContent = username.trim();
        } else {
            nameHeading.textContent = 'user';
        }
    } catch (error) {
        nameHeading.textContent = 'user';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', adlf);
} else {
    adlf();
}