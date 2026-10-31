const video = document.getElementById('video');
const timeCont = document.querySelector('.timecont');
const timeFill = document.getElementById('time');
const playButton = document.getElementById('play');
const volumeButton = document.getElementById('volumepok');
const volumeInput = document.getElementById('volume');
const fullscreenButton = document.getElementById('fullscreen');
const backToAudioButton = document.getElementById('backtoaudio');
const mainContainer = document.querySelector('.main');
const controlsEl = document.querySelector('.controls');

const ICON_PLAY = '\uE768';
const ICON_PAUSE = '\uE769';
const ICON_VOLUME_MUTED = '\uEA85';
const ICON_VOLUME_20 = '\uE992';
const ICON_VOLUME_40 = '\uE993';
const ICON_VOLUME_60 = '\uE994';
const ICON_VOLUME_80 = '\uE995';
const ICON_FULLSCREEN = '\uE92D';
const ICON_FULLSCREEN_ACTIVE = '\uE92C';

const HIDE_DELAY = 3000;

let savedVolume = 70;
let hideTimer = null;
let currentState = null;

function loadState() {
    try {
        const raw = localStorage.getItem('parnasocial:fullscreen:state');

        if (!raw) {
            return null;
        }

        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function clearState() {
    try {
        localStorage.removeItem('parnasocial:fullscreen:state');
    } catch (error) {
    }
}

function applyFullscreenTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    const bg = theme === '1' ? '#101010' : '#F5F5F5';

    document.body.style.backgroundColor = bg;

    if (mainContainer) {
        mainContainer.style.backgroundColor = bg;
    }
}

function getVolumeIcon(value) {
    if (value <= 0) {
        return ICON_VOLUME_MUTED;
    }

    if (value <= 20) {
        return ICON_VOLUME_20;
    }

    if (value <= 40) {
        return ICON_VOLUME_40;
    }

    if (value < 80) {
        return ICON_VOLUME_60;
    }

    return ICON_VOLUME_80;
}

function applyVolume() {
    const value = Number(volumeInput.value);
    video.volume = value / 100;
    volumeButton.textContent = getVolumeIcon(value);
}

function setVolumeValue(value) {
    if (value < 0) {
        value = 0;
    }

    if (value > 100) {
        value = 100;
    }

    volumeInput.value = String(value);

    if (value > 0) {
        savedVolume = value;
    }

    applyVolume();
}

function changeVolume(delta) {
    setVolumeValue(Number(volumeInput.value) + delta);
}

function toggleMute() {
    const current = Number(volumeInput.value);

    if (current > 0) {
        savedVolume = current;
        setVolumeValue(0);
    } else {
        if (savedVolume > 0) {
            setVolumeValue(savedVolume);
        } else {
            setVolumeValue(70);
        }
    }
}

function togglePlay() {
    if (video.paused) {
        video.play().catch(() => {
        });
    } else {
        video.pause();
    }
}

function seekBy(seconds) {
    if (!Number.isFinite(video.duration)) {
        return;
    }

    let target = video.currentTime + seconds;

    if (target < 0) {
        target = 0;
    }

    if (target > video.duration) {
        target = video.duration;
    }

    video.currentTime = target;
}

function updateTimeline() {
    if (Number.isFinite(video.duration) && video.duration > 0) {
        timeFill.style.width = ((video.currentTime / video.duration) * 100) + '%';
    } else {
        timeFill.style.width = '0%';
    }
}

function updateFullscreenIcon() {
    if (document.fullscreenElement) {
        fullscreenButton.textContent = ICON_FULLSCREEN_ACTIVE;
    } else {
        fullscreenButton.textContent = ICON_FULLSCREEN;
    }
}

function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else if (mainContainer) {
        mainContainer.requestFullscreen().catch(() => {
        });
    }
}

function showControls() {
    if (!controlsEl) {
        return;
    }

    controlsEl.style.opacity = '1';
    controlsEl.style.pointerEvents = 'auto';
}

function hideControls() {
    if (!controlsEl) {
        return;
    }

    controlsEl.style.opacity = '0';
    controlsEl.style.pointerEvents = 'none';
}

function resetHideTimer() {
    showControls();

    if (hideTimer) {
        clearTimeout(hideTimer);
    }

    hideTimer = setTimeout(hideControls, HIDE_DELAY);
}

function playNext() {
    if (!currentState || !Array.isArray(currentState.playlist)) {
        return;
    }

    let next = currentState.currentIndex + 1;

    if (next >= currentState.playlist.length) {
        if (currentState.repeat === 'all') {
            next = 0;
        } else {
            video.pause();
            return;
        }
    }

    const track = currentState.playlist[next];

    if (!track) {
        return;
    }

    currentState.currentIndex = next;
    video.src = track.path;
    video.load();
    video.play().catch(() => {
    });
}

function playPrev() {
    if (!currentState || !Array.isArray(currentState.playlist)) {
        return;
    }

    if (video.currentTime > 3) {
        video.currentTime = 0;
        return;
    }

    let prev = currentState.currentIndex - 1;

    if (prev < 0) {
        if (currentState.repeat === 'all') {
            prev = currentState.playlist.length - 1;
        } else {
            prev = 0;
        }
    }

    const track = currentState.playlist[prev];

    if (!track) {
        return;
    }

    currentState.currentIndex = prev;
    video.src = track.path;
    video.load();
    video.play().catch(() => {
    });
}

function backToAudio() {
    if (currentState) {
        try {
            const returnState = {
                currentIndex: currentState.currentIndex,
                currentTime: video.currentTime,
                isPlaying: !video.paused,
                volume: Number(volumeInput.value),
                repeat: currentState.repeat,
                shuffle: currentState.shuffle,
                playlist: currentState.playlist
            };

            localStorage.setItem('parnasocial:returnState', JSON.stringify(returnState));
        } catch (error) {
        }
    }

    clearState();

    if (window.parnasocial && window.parnasocial.window && typeof window.parnasocial.window.close === 'function') {
        window.parnasocial.window.close();
    }
}

video.addEventListener('play', () => {
    playButton.textContent = ICON_PAUSE;
});

video.addEventListener('pause', () => {
    playButton.textContent = ICON_PLAY;
});

video.addEventListener('ended', () => {
    playButton.textContent = ICON_PLAY;

    if (currentState && currentState.repeat === 'one') {
        video.currentTime = 0;
        video.play().catch(() => {
        });
    } else {
        playNext();
    }
});

video.addEventListener('timeupdate', updateTimeline);

video.addEventListener('loadedmetadata', () => {
    applyVolume();
    updateTimeline();

    if (currentState && typeof currentState.currentTime === 'number') {
        video.currentTime = currentState.currentTime;
        currentState.currentTime = null;

        if (currentState.isPlaying) {
            video.play().catch(() => {
            });
        }
    }
});

video.addEventListener('durationchange', updateTimeline);

video.addEventListener('seeked', updateTimeline);

video.addEventListener('click', (event) => {
    event.stopPropagation();
    togglePlay();
    resetHideTimer();
});

playButton.addEventListener('click', (event) => {
    event.stopPropagation();
    togglePlay();
    playButton.blur();
    resetHideTimer();
});

volumeButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleMute();
    volumeButton.blur();
    resetHideTimer();
});

fullscreenButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleFullscreen();
    fullscreenButton.blur();
    resetHideTimer();
});

backToAudioButton.addEventListener('click', (event) => {
    event.stopPropagation();
    backToAudio();
});

volumeInput.addEventListener('input', () => {
    const value = Number(volumeInput.value);

    if (value > 0) {
        savedVolume = value;
    }

    applyVolume();
    resetHideTimer();
});

timeCont.addEventListener('click', (event) => {
    event.stopPropagation();

    if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
    }

    const rect = timeCont.getBoundingClientRect();

    if (rect.width <= 0) {
        return;
    }

    let ratio = (event.clientX - rect.left) / rect.width;

    if (ratio < 0) {
        ratio = 0;
    }

    if (ratio > 1) {
        ratio = 1;
    }

    video.currentTime = ratio * video.duration;
    updateTimeline();
    resetHideTimer();
});

document.addEventListener('fullscreenchange', updateFullscreenIcon);

if (mainContainer) {
    mainContainer.addEventListener('mousemove', resetHideTimer);
    mainContainer.addEventListener('mouseenter', resetHideTimer);
}

document.addEventListener('keydown', (event) => {
    const active = document.activeElement;

    if (active && active !== video) {
        const tag = active.tagName;

        if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'TEXTAREA' || tag === 'SELECT' || active.isContentEditable) {
            return;
        }
    }

    resetHideTimer();

    if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
        return;
    }

    if (event.code === 'ArrowLeft') {
        event.preventDefault();
        seekBy(-5);
        return;
    }

    if (event.code === 'ArrowRight') {
        event.preventDefault();
        seekBy(5);
        return;
    }

    if (event.code === 'ArrowUp') {
        event.preventDefault();
        changeVolume(5);
        return;
    }

    if (event.code === 'ArrowDown') {
        event.preventDefault();
        changeVolume(-5);
        return;
    }

    if (event.code === 'KeyM') {
        event.preventDefault();
        toggleMute();
        return;
    }

    if (event.code === 'KeyF') {
        event.preventDefault();
        toggleFullscreen();
        return;
    }

    if (event.code === 'KeyN') {
        event.preventDefault();
        playNext();
        return;
    }

    if (event.code === 'KeyP') {
        event.preventDefault();
        playPrev();
        return;
    }

    if (event.code === 'Escape') {
        event.preventDefault();
        backToAudio();
        return;
    }
});

const themeObserver = new MutationObserver(applyFullscreenTheme);
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

currentState = loadState();

if (currentState && currentState.src) {
    video.src = currentState.src;
    video.load();

    if (typeof currentState.volume === 'number') {
        volumeInput.value = String(currentState.volume);
        savedVolume = currentState.volume > 0 ? currentState.volume : 70;
    }
}

savedVolume = Number(volumeInput.value) > 0 ? Number(volumeInput.value) : 70;
applyVolume();
applyFullscreenTheme();
updateTimeline();
updateFullscreenIcon();
resetHideTimer();