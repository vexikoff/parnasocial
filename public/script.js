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

document.addEventListener('DOMContentLoaded', function() {
    const srche = document.getElementById('srch');
    const srcce = document.getElementById('srcc');
    const top2 = document.querySelector('.top');

    srche.addEventListener('mouseenter', function() {
        srcce.focus();
        srcce.classList.remove('skr');
    });
    top2.addEventListener('mouseleave', function() {
        srcce.classList.add('skr');
    });
    const srchep = document.getElementById('srchp');
    const srccep = document.getElementById('srccp');
    const top2p = document.querySelector('.topp');

    srchep.addEventListener('mouseenter', function() {
        srccep.focus();
        srccep.classList.remove('skr');
    });
    top2p.addEventListener('mouseleave', function() {
        srccep.classList.add('skr');
    })
});

const fileBtn = document.getElementById('file');
const fileMenu = document.getElementById('files');
const recentMenu = document.querySelector('.recentt');
const recentBtn = fileMenu ? fileMenu.querySelectorAll('.file.row')[1] : null;

let closeTimer = null;

function cancelClose() {
    clearTimeout(closeTimer);
}

function hideAll() {
    if (fileMenu) {
        fileMenu.classList.add('hidden');
    }

    if (recentMenu) {
        recentMenu.classList.add('hidden');
    }
}

function scheduleHide() {
    cancelClose();
    closeTimer = setTimeout(hideAll, 150);
}

function place(el, x, y) {
    if (!el) {
        return;
    }

    el.classList.remove('hidden');
    el.style.setProperty('position', 'fixed', 'important');
    el.style.setProperty('left', x + 'px', 'important');
    el.style.setProperty('top', y + 'px', 'important');
    el.style.setProperty('width', 'max-content', 'important');
    el.style.setProperty('transform', 'none', 'important');
    el.style.setProperty('transition', 'none', 'important');
    el.style.setProperty('animation', 'none', 'important');
    el.style.setProperty('z-index', '9999', 'important');
}

if (fileBtn && fileMenu) {
    fileBtn.addEventListener('mouseenter', () => {
        const r = fileBtn.getBoundingClientRect();

        if (recentMenu) {
            recentMenu.classList.add('hidden');
        }

        place(fileMenu, r.left, r.bottom);
    });

    fileBtn.addEventListener('mouseleave', scheduleHide);
    fileMenu.addEventListener('mouseenter', cancelClose);
    fileMenu.addEventListener('mouseleave', scheduleHide);
}

if (recentBtn && recentMenu) {
    recentBtn.addEventListener('mouseenter', () => {
        const r = recentBtn.getBoundingClientRect();
        place(recentMenu, r.right, r.top);
    });

    recentBtn.addEventListener('mouseleave', scheduleHide);
    recentMenu.addEventListener('mouseenter', cancelClose);
    recentMenu.addEventListener('mouseleave', scheduleHide);
}