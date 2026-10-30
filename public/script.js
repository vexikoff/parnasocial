var yaebalneironki = localStorage.getItem('yaebalneironki');
const settings = document.querySelector('.settings');

if (yaebalneironki !== '0' && yaebalneironki !== '1') {
    yaebalneironki = '0';
}

function aplittheme() {
    document.documentElement.setAttribute('data-theme', yaebalneironki);
}

function saveth(theme) {
    if (theme !== '0' && theme !== '1') {
        return;
    }

    yaebalneironki = theme;
    localStorage.setItem('yaebalneironki', yaebalneironki);
    aplittheme();
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

aplittheme();