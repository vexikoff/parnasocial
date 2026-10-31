const video = document.getElementById('video');
const timeCont = document.querySelector('.timecont');
const timeFill = document.getElementById('time');
const playButton = document.getElementById('play');
const volumeButton = document.getElementById('volumepok');
const volumeInput = document.getElementById('volume');
const fullscreenButton = document.getElementById('fullscreen');
const mainContainer = document.querySelector('.main');

const ICON_PLAY = '\uE768';
const ICON_PAUSE = '\uE769';
const ICON_VOLUME_MUTED = '\uEA85';
const ICON_VOLUME_20 = '\uE992';
const ICON_VOLUME_40 = '\uE993';
const ICON_VOLUME_60 = '\uE994';
const ICON_VOLUME_80 = '\uE995';
const ICON_FULLSCREEN = '\uE92D';
const ICON_FULLSCREEN_ACTIVE = '\uE92C';

let savedVolume = 70;

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
        video.play();
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
    } else {
        mainContainer.requestFullscreen();
    }
}

video.addEventListener('play', function() {
    playButton.textContent = ICON_PAUSE;
});

video.addEventListener('pause', function() {
    playButton.textContent = ICON_PLAY;
});

video.addEventListener('ended', function() {
    playButton.textContent = ICON_PLAY;
});

video.addEventListener('timeupdate', updateTimeline);

video.addEventListener('loadedmetadata', function() {
    applyVolume();
    updateTimeline();
});

video.addEventListener('durationchange', updateTimeline);

video.addEventListener('seeked', updateTimeline);

playButton.addEventListener('click', function() {
    togglePlay();
    playButton.blur();
});

volumeButton.addEventListener('click', function() {
    toggleMute();
    volumeButton.blur();
});

fullscreenButton.addEventListener('click', function() {
    toggleFullscreen();
    fullscreenButton.blur();
});

volumeInput.addEventListener('input', function() {
    const value = Number(volumeInput.value);

    if (value > 0) {
        savedVolume = value;
    }

    applyVolume();
});

timeCont.addEventListener('click', function(event) {
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
});

document.addEventListener('fullscreenchange', updateFullscreenIcon);

document.addEventListener('keydown', function(event) {
    const active = document.activeElement;

    if (active) {
        const tag = active.tagName;

        if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'TEXTAREA' || tag === 'SELECT' || active.isContentEditable) {
            return;
        }
    }

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
});

savedVolume = Number(volumeInput.value) > 0 ? Number(volumeInput.value) : 70;
applyVolume();
updateTimeline();
updateFullscreenIcon();