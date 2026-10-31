const state = {
    playlist: [],
    currentIndex: -1,
    repeat: 'none',
    shuffle: false,
    shuffleOrder: [],
    shuffleIndex: -1,
    volume: 70,
    savedVolume: 70,
    isPlaying: false,
    currentTime: 0,
    openedDirs: [],
    searchLeft: '',
    searchRight: '',
    activeFolder: null,
    directoryTrees: []
};

const STORAGE_KEY = 'parnasocial:state';
const THEME_KEY = 'yaebalneironki';
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'];
const VIDEO_EXTS = ['mp4', 'webm', 'mkv', 'mov', 'avi'];

const ICON_PLAY = '\uE768';
const ICON_PAUSE = '\uE769';
const ICON_VOLUME_MUTED = '\uEA85';
const ICON_VOLUME_20 = '\uE992';
const ICON_VOLUME_40 = '\uE993';
const ICON_VOLUME_60 = '\uE994';
const ICON_VOLUME_80 = '\uE995';
const ICON_REPEAT_NONE = '\uF5E7';
const ICON_REPEAT_ALL = '\uE8EE';
const ICON_REPEAT_ONE = '\uE8ED';
const ICON_SHUFFLE = '\uE8B1';
const ICON_FOLDER = '\uE8B7';
const ICON_MUSIC = '\uE90B';
const ICON_VIDEO = '\uE714';
const ICON_FOLDER_CLOSED = '\uE70D';
const ICON_FOLDER_OPEN = '\uE76C';

const audio = new Audio();
audio.preload = 'metadata';

const settings = document.querySelector('.settings');
const themeSwitch = document.querySelector('.switch input[type="checkbox"]');

const directoryEl = document.querySelector('.directory');
const playlistEl = document.querySelector('.playlist');
const playerImg = document.getElementById('playerimg');
const timeFill = document.getElementById('time');
const trackName = document.querySelector('.trackname');
const trackAuthor = document.querySelector('.trackauthor');
const trackTime = document.querySelector('.tracktime');
const playBtn = document.getElementById('play');
const backBtn = document.getElementById('back');
const nextBtn = document.getElementById('next');
const videoModeBtn = document.getElementById('videomode');
const volumeBtn = document.getElementById('volumepok');
const volumeInput = document.getElementById('volume');
const openFolderBtn = document.getElementById('openfolder');
const repeatFolderBtn = document.getElementById('repeatfolder');
const shuffleFolderBtn = document.getElementById('shufflefolder');
const folderToPlaylistBtn = document.getElementById('foldertoplaylist');
const searchLeftBtn = document.getElementById('srch');
const searchLeftInput = document.getElementById('srcc');
const openPlaylistBtn = document.getElementById('openplaylist');
const repeatPlaylistBtn = document.getElementById('repeatplaylist');
const shufflePlaylistBtn = document.getElementById('shuffleplaylist');
const addPlaylistBtn = document.getElementById('addplaylist');
const addFolderPlaylistBtn = document.getElementById('addfolderplaylist');
const searchRightBtn = document.getElementById('srchp');
const searchRightInput = document.getElementById('srccp');
const leftPanel = document.querySelector('.left');
const rightPanel = document.querySelector('.right');

let yaebalneironki = localStorage.getItem(THEME_KEY);

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
    localStorage.setItem(THEME_KEY, yaebalneironki);
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

function getFileExtension(filePath) {
    if (typeof filePath !== 'string') {
        return '';
    }

    const idx = filePath.lastIndexOf('.');

    if (idx === -1) {
        return '';
    }

    return filePath.slice(idx + 1).toLowerCase();
}

function getMediaType(filePath) {
    const ext = getFileExtension(filePath);

    if (AUDIO_EXTS.includes(ext)) {
        return 'audio';
    }

    if (VIDEO_EXTS.includes(ext)) {
        return 'video';
    }

    return 'file';
}

function stripExt(name) {
    const idx = name.lastIndexOf('.');

    if (idx === -1) {
        return name;
    }

    return name.slice(0, idx);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function saveState() {
    try {
        const data = {
            playlist: state.playlist,
            currentIndex: state.currentIndex,
            repeat: state.repeat,
            shuffle: state.shuffle,
            volume: state.volume,
            openedDirs: state.openedDirs
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return;
        }

        const data = JSON.parse(raw);

        if (Array.isArray(data.playlist)) {
            state.playlist = data.playlist;
        }

        if (typeof data.currentIndex === 'number') {
            state.currentIndex = data.currentIndex;
        }

        if (data.repeat === 'none' || data.repeat === 'all' || data.repeat === 'one') {
            state.repeat = data.repeat;
        }

        if (typeof data.shuffle === 'boolean') {
            state.shuffle = data.shuffle;
        }

        if (typeof data.volume === 'number') {
            state.volume = data.volume;
            state.savedVolume = data.volume > 0 ? data.volume : 70;
        }

        if (Array.isArray(data.openedDirs)) {
            state.openedDirs = data.openedDirs;
        }
    } catch (error) {
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
    audio.volume = state.volume / 100;

    if (volumeBtn) {
        volumeBtn.textContent = getVolumeIcon(state.volume);
    }

    if (volumeInput) {
        volumeInput.value = String(state.volume);
    }
}

function setVolumeValue(value) {
    if (value < 0) {
        value = 0;
    }

    if (value > 100) {
        value = 100;
    }

    state.volume = Math.round(value);

    if (state.volume > 0) {
        state.savedVolume = state.volume;
    }

    applyVolume();
    saveState();
}

function toggleMute() {
    if (state.volume > 0) {
        state.savedVolume = state.volume;
        setVolumeValue(0);
    } else {
        if (state.savedVolume > 0) {
            setVolumeValue(state.savedVolume);
        } else {
            setVolumeValue(70);
        }
    }
}

function shuffleArray(arr) {
    const result = arr.slice();

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = result[i];
        result[i] = result[j];
        result[j] = tmp;
    }

    return result;
}

function regenerateShuffleOrder() {
    const indices = [];

    for (let i = 0; i < state.playlist.length; i++) {
        indices.push(i);
    }

    state.shuffleOrder = shuffleArray(indices);

    const currentIdx = state.shuffleOrder.indexOf(state.currentIndex);

    if (currentIdx !== -1) {
        state.shuffleOrder.splice(currentIdx, 1);
        state.shuffleOrder.unshift(state.currentIndex);
    }

    state.shuffleIndex = 0;
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return '0:00';
    }

    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    const secs = total % 60;

    return minutes + ':' + (secs < 10 ? '0' : '') + secs;
}

function updateTrackInfo() {
    const track = state.playlist[state.currentIndex];

    if (!track) {
        if (trackName) {
            trackName.textContent = 'Parnasocial';
        }

        if (trackAuthor) {
            trackAuthor.textContent = 'vexikoff';
        }

        if (trackTime) {
            trackTime.textContent = '0:00';
        }

        if (playerImg) {
            playerImg.src = '../assets/pre.png';
        }

        return;
    }

    if (trackName) {
        trackName.textContent = stripExt(track.name);
    }

    if (trackAuthor) {
        trackAuthor.textContent = '';
    }

    if (playerImg && track.type === 'audio') {
        playerImg.src = '../assets/pre.png';
    }
}

function updatePlayButton() {
    if (playBtn) {
        playBtn.textContent = state.isPlaying ? ICON_PAUSE : ICON_PLAY;
    }
}

function updateRepeatButtons() {
    const icon = state.repeat === 'none'
        ? ICON_REPEAT_NONE
        : state.repeat === 'all'
            ? ICON_REPEAT_ALL
            : ICON_REPEAT_ONE;

    if (repeatFolderBtn) {
        repeatFolderBtn.textContent = icon;
    }

    if (repeatPlaylistBtn) {
        repeatPlaylistBtn.textContent = icon;
    }
}

function updateShuffleButtons() {
    if (shuffleFolderBtn) {
        shuffleFolderBtn.textContent = ICON_SHUFFLE;

        if (state.shuffle) {
            shuffleFolderBtn.classList.add('active');
        } else {
            shuffleFolderBtn.classList.remove('active');
        }
    }

    if (shufflePlaylistBtn) {
        shufflePlaylistBtn.textContent = ICON_SHUFFLE;

        if (state.shuffle) {
            shufflePlaylistBtn.classList.add('active');
        } else {
            shufflePlaylistBtn.classList.remove('active');
        }
    }
}

function updateTimeline() {
    if (!timeFill) {
        return;
    }

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
        timeFill.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
    } else {
        timeFill.style.width = '0%';
    }

    if (trackTime) {
        trackTime.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
    }
}

function loadTrack(index, autoPlay) {
    if (index < 0 || index >= state.playlist.length) {
        return;
    }

    state.currentIndex = index;
    const track = state.playlist[index];

    audio.src = track.path;
    audio.load();

    updateTrackInfo();

    if (autoPlay) {
        audio.play().catch(() => {
        });
    }

    if (state.shuffle) {
        const shuffleIdx = state.shuffleOrder.indexOf(index);

        if (shuffleIdx !== -1) {
            state.shuffleIndex = shuffleIdx;
        }
    }

    saveState();
}

function getNextIndex() {
    if (state.playlist.length === 0) {
        return -1;
    }

    if (state.repeat === 'one') {
        return state.currentIndex;
    }

    if (state.shuffle && state.shuffleOrder.length > 0) {
        state.shuffleIndex = (state.shuffleIndex + 1) % state.shuffleOrder.length;
        return state.shuffleOrder[state.shuffleIndex];
    }

    const next = state.currentIndex + 1;

    if (next >= state.playlist.length) {
        if (state.repeat === 'all') {
            return 0;
        }

        return -1;
    }

    return next;
}

function getPrevIndex() {
    if (state.playlist.length === 0) {
        return -1;
    }

    if (state.shuffle && state.shuffleOrder.length > 0) {
        state.shuffleIndex = (state.shuffleIndex - 1 + state.shuffleOrder.length) % state.shuffleOrder.length;
        return state.shuffleOrder[state.shuffleIndex];
    }

    const prev = state.currentIndex - 1;

    if (prev < 0) {
        if (state.repeat === 'all') {
            return state.playlist.length - 1;
        }

        return 0;
    }

    return prev;
}

function playNext() {
    const next = getNextIndex();

    if (next === -1) {
        audio.pause();
        state.isPlaying = false;
        updatePlayButton();
        return;
    }

    loadTrack(next, true);
}

function playPrev() {
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }

    const prev = getPrevIndex();

    if (prev === -1) {
        return;
    }

    loadTrack(prev, true);
}

function togglePlay() {
    if (state.playlist.length === 0) {
        return;
    }

    if (state.currentIndex === -1) {
        loadTrack(0, true);
        return;
    }

    if (audio.paused) {
        audio.play().catch(() => {
        });
    } else {
        audio.pause();
    }
}

function seekBy(seconds) {
    if (!Number.isFinite(audio.duration)) {
        return;
    }

    let target = audio.currentTime + seconds;

    if (target < 0) {
        target = 0;
    }

    if (target > audio.duration) {
        target = audio.duration;
    }

    audio.currentTime = target;
}

function cycleRepeat() {
    if (state.repeat === 'none') {
        state.repeat = 'all';
    } else if (state.repeat === 'all') {
        state.repeat = 'one';
    } else {
        state.repeat = 'none';
    }

    updateRepeatButtons();
    saveState();
}

function toggleShuffle() {
    state.shuffle = !state.shuffle;

    if (state.shuffle) {
        regenerateShuffleOrder();
    }

    updateShuffleButtons();
    saveState();
}

function filterTree(nodes, query) {
    if (!query) {
        return nodes;
    }

    const lower = query.toLowerCase();
    const result = [];

    for (const node of nodes) {
        if (node.type === 'folder') {
            const filteredChildren = filterTree(node.children || [], query);

            if (node.name.toLowerCase().includes(lower) || filteredChildren.length > 0) {
                result.push({
                    name: node.name,
                    path: node.path,
                    type: 'folder',
                    children: filteredChildren,
                    forceOpen: filteredChildren.length > 0
                });
            }
        } else if (node.type === 'audio' || node.type === 'video') {
            if (node.name.toLowerCase().includes(lower)) {
                result.push(node);
            }
        }
    }

    return result;
}

function filterPlaylist(items, query) {
    if (!query) {
        return items;
    }

    const lower = query.toLowerCase();

    return items.filter((item) => item.name.toLowerCase().includes(lower));
}

function findNodeByPath(nodes, targetPath) {
    for (const node of nodes) {
        if (node.path === targetPath) {
            return node;
        }

        if (node.type === 'folder' && node.children) {
            const found = findNodeByPath(node.children, targetPath);

            if (found) {
                return found;
            }
        }
    }

    return null;
}

function collectMediaFromNode(node) {
    const result = [];

    if (!node) {
        return result;
    }

    if (node.type === 'audio' || node.type === 'video') {
        result.push({
            id: generateId(),
            name: node.name,
            path: node.path,
            type: node.type
        });
        return result;
    }

    if (node.type === 'folder' && Array.isArray(node.children)) {
        for (const child of node.children) {
            const childMedia = collectMediaFromNode(child);

            for (const m of childMedia) {
                result.push(m);
            }
        }
    }

    return result;
}

function addToPlaylist(items) {
    for (const item of items) {
        state.playlist.push({
            id: generateId(),
            name: item.name,
            path: item.path,
            type: item.type
        });
    }

    if (state.shuffle) {
        regenerateShuffleOrder();
    }

    renderPlaylist();
    saveState();
}

function addPathsToPlaylist(paths) {
    const items = [];

    for (const p of paths) {
        const type = getMediaType(p);

        if (type === 'audio' || type === 'video') {
            items.push({
                name: p.split(/[\\/]/).pop() || p,
                path: p,
                type
            });
        }
    }

    addToPlaylist(items);
}

async function addFolderToPlaylist(dirPath) {
    if (!window.parnasocial || !window.parnasocial.folder) {
        return;
    }

    const tree = await window.parnasocial.folder.read(dirPath);

    if (!tree) {
        return;
    }

    const root = {
        type: 'folder',
        children: tree
    };

    const items = collectMediaFromNode(root);
    addToPlaylist(items);
}

function removeFromPlaylist(index) {
    if (index < 0 || index >= state.playlist.length) {
        return;
    }

    const removedCurrent = index === state.currentIndex;

    state.playlist.splice(index, 1);

    if (removedCurrent) {
        if (state.playlist.length === 0) {
            state.currentIndex = -1;
            audio.src = '';
            state.isPlaying = false;
            updateTrackInfo();
            updatePlayButton();
        } else if (state.currentIndex >= state.playlist.length) {
            state.currentIndex = 0;
            loadTrack(0, false);
        } else {
            loadTrack(state.currentIndex, state.isPlaying);
        }
    } else if (index < state.currentIndex) {
        state.currentIndex--;
    }

    if (state.shuffle) {
        regenerateShuffleOrder();
    }

    renderPlaylist();
    saveState();
}

function buildFileNode(node) {
    const container = document.createElement('div');
    container.className = 'file';

    const row = document.createElement('div');
    row.className = 'row';

    const icon = document.createElement('p');
    icon.className = 'segoeplus';
    icon.textContent = node.type === 'video' ? ICON_VIDEO : ICON_MUSIC;

    const name = document.createElement('p');
    name.className = 'foldername';
    name.textContent = node.name;

    row.appendChild(icon);
    row.appendChild(name);

    row.addEventListener('dblclick', (event) => {
        event.stopPropagation();

        const media = {
            id: generateId(),
            name: node.name,
            path: node.path,
            type: node.type
        };

        state.playlist.push(media);

        if (state.shuffle) {
            regenerateShuffleOrder();
        }

        const idx = state.playlist.length - 1;
        loadTrack(idx, true);
        renderPlaylist();
        saveState();
    });

    row.draggable = true;

    row.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/parnasocial-node', node.path);
        event.dataTransfer.effectAllowed = 'copy';
    });

    container.appendChild(row);
    return container;
}

function buildDirectoryNode(node, depth) {
    const container = document.createElement('div');
    container.className = 'folder';

    const row = document.createElement('div');
    row.className = 'row';

    const chevron = document.createElement('p');
    chevron.className = 'segoeplus';

    const icon = document.createElement('p');
    icon.className = 'segoeplus';
    icon.textContent = ICON_FOLDER;

    const name = document.createElement('p');
    name.className = 'foldername';
    name.textContent = node.name;

    const isOpen = state.openedDirs.includes(node.path) || node.forceOpen === true;

    if (isOpen) {
        chevron.textContent = ICON_FOLDER_OPEN;
    } else {
        chevron.textContent = ICON_FOLDER_CLOSED;
    }

    row.appendChild(chevron);
    row.appendChild(icon);
    row.appendChild(name);

    row.addEventListener('click', (event) => {
        event.stopPropagation();

        const idx = state.openedDirs.indexOf(node.path);

        if (idx === -1) {
            state.openedDirs.push(node.path);
            state.activeFolder = node.path;
        } else {
            state.openedDirs.splice(idx, 1);

            if (state.activeFolder === node.path) {
                state.activeFolder = null;
            }
        }

        saveState();
        renderDirectory();
    });

    row.draggable = true;

    row.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/parnasocial-node', node.path);
        event.dataTransfer.effectAllowed = 'copy';
    });

    container.appendChild(row);

    if (isOpen && Array.isArray(node.children)) {
        const spacer = document.createElement('div');
        spacer.className = 'spacer';
        container.appendChild(spacer);

        for (const child of node.children) {
            if (child.type === 'folder') {
                container.appendChild(buildDirectoryNode(child, depth + 1));
            } else if (child.type === 'audio' || child.type === 'video') {
                container.appendChild(buildFileNode(child));
            }
        }
    }

    return container;
}

function makeEmptyText(text) {
    const empty = document.createElement('p');
    empty.className = 'foldername';
    empty.textContent = text;
    empty.style.opacity = '0.5';
    return empty;
}

function renderDirectory() {
    if (!directoryEl) {
        return;
    }

    directoryEl.innerHTML = '';

    if (!Array.isArray(state.directoryTrees) || state.directoryTrees.length === 0) {
        directoryEl.appendChild(makeEmptyText('No folders opened'));
        return;
    }

    const filtered = filterTree(state.directoryTrees, state.searchLeft);

    if (filtered.length === 0) {
        directoryEl.appendChild(makeEmptyText('Nothing found'));
        return;
    }

    for (const node of filtered) {
        if (node.type === 'folder') {
            directoryEl.appendChild(buildDirectoryNode(node, 0));
        } else if (node.type === 'audio' || node.type === 'video') {
            directoryEl.appendChild(buildFileNode(node));
        }
    }
}

function renderPlaylist() {
    if (!playlistEl) {
        return;
    }

    playlistEl.innerHTML = '';

    const filtered = filterPlaylist(state.playlist, state.searchRight);

    if (filtered.length === 0) {
        if (state.playlist.length === 0) {
            playlistEl.appendChild(makeEmptyText('Playlist is empty'));
        } else {
            playlistEl.appendChild(makeEmptyText('Nothing found'));
        }

        return;
    }

    for (const item of filtered) {
        const realIndex = state.playlist.indexOf(item);
        const container = document.createElement('div');
        container.className = 'file';

        if (realIndex === state.currentIndex) {
            container.classList.add('active');
        }

        const row = document.createElement('div');
        row.className = 'row';

        const icon = document.createElement('p');
        icon.className = 'segoeplus';
        icon.textContent = item.type === 'video' ? ICON_VIDEO : ICON_MUSIC;

        const name = document.createElement('p');
        name.className = 'foldername';
        name.textContent = stripExt(item.name);

        row.appendChild(icon);
        row.appendChild(name);

        row.addEventListener('click', (event) => {
            event.stopPropagation();
            loadTrack(realIndex, true);
            renderPlaylist();
        });

        row.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            removeFromPlaylist(realIndex);
        });

        container.appendChild(row);
        playlistEl.appendChild(container);
    }
}

async function openFolderAndAdd() {
    if (!window.parnasocial || !window.parnasocial.folder) {
        return;
    }

    const dirPath = await window.parnasocial.folder.open();

    if (!dirPath) {
        return;
    }

    const tree = await window.parnasocial.folder.read(dirPath);

    const rootNode = {
        name: dirPath.split(/[\\/]/).pop() || dirPath,
        path: dirPath,
        type: 'folder',
        children: Array.isArray(tree) ? tree : []
    };

    state.directoryTrees.push(rootNode);

    if (!state.openedDirs.includes(dirPath)) {
        state.openedDirs.push(dirPath);
    }

    state.activeFolder = dirPath;

    renderDirectory();
    saveState();
}

async function addFilesDialog() {
    if (!window.parnasocial || !window.parnasocial.folder) {
        return;
    }

    const paths = await window.parnasocial.folder.openFiles();

    if (!paths || paths.length === 0) {
        return;
    }

    addPathsToPlaylist(paths);
}

async function addFolderDialog() {
    if (!window.parnasocial || !window.parnasocial.folder) {
        return;
    }

    const dirPath = await window.parnasocial.folder.open();

    if (!dirPath) {
        return;
    }

    await addFolderToPlaylist(dirPath);
}

function addActiveFolderToPlaylist() {
    if (!state.activeFolder || !Array.isArray(state.directoryTrees)) {
        return;
    }

    let rootNode = state.directoryTrees.find((n) => n.path === state.activeFolder);

    if (!rootNode) {
        for (const root of state.directoryTrees) {
            rootNode = findNodeByPath(root.children || [], state.activeFolder);

            if (rootNode) {
                break;
            }
        }
    }

    if (!rootNode) {
        return;
    }

    const items = collectMediaFromNode(rootNode);
    addToPlaylist(items);
}

function setupDropZone(element, handler) {
    if (!element) {
        return;
    }

    element.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        element.classList.add('dragover');
    });

    element.addEventListener('dragleave', () => {
        element.classList.remove('dragover');
    });

    element.addEventListener('drop', async (event) => {
        event.preventDefault();
        element.classList.remove('dragover');

        const nodePath = event.dataTransfer.getData('text/parnasocial-node');

        if (nodePath && Array.isArray(state.directoryTrees)) {
            let foundNode = null;

            for (const root of state.directoryTrees) {
                if (root.path === nodePath) {
                    foundNode = root;
                    break;
                }

                const inner = findNodeByPath(root.children || [], nodePath);

                if (inner) {
                    foundNode = inner;
                    break;
                }
            }

            if (foundNode) {
                const items = collectMediaFromNode(foundNode);
                handler(items);
                return;
            }
        }

        const files = event.dataTransfer.files;

        if (files && files.length > 0) {
            const items = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (file && file.path) {
                    const type = getMediaType(file.path);

                    if (type === 'audio' || type === 'video') {
                        items.push({
                            name: file.name || file.path.split(/[\\/]/).pop(),
                            path: file.path,
                            type
                        });
                    }
                }
            }

            if (items.length > 0) {
                handler(items);
            }
        }
    });
}

setupDropZone(leftPanel, (items) => {
    addToPlaylist(items);
});

setupDropZone(rightPanel, (items) => {
    addToPlaylist(items);
});

audio.addEventListener('play', () => {
    state.isPlaying = true;
    updatePlayButton();
});

audio.addEventListener('pause', () => {
    state.isPlaying = false;
    updatePlayButton();
});

audio.addEventListener('ended', () => {
    state.isPlaying = false;
    updatePlayButton();
    playNext();
});

audio.addEventListener('timeupdate', updateTimeline);

audio.addEventListener('loadedmetadata', () => {
    updateTimeline();
});

audio.addEventListener('durationchange', updateTimeline);

audio.addEventListener('seeked', updateTimeline);

if (playBtn) {
    playBtn.addEventListener('click', () => {
        togglePlay();
        playBtn.blur();
    });
}

if (backBtn) {
    backBtn.addEventListener('click', () => {
        playPrev();
        backBtn.blur();
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        playNext();
        nextBtn.blur();
    });
}

if (videoModeBtn) {
    videoModeBtn.addEventListener('click', () => {
        if (!window.parnasocial || !window.parnasocial.fullscreen) {
            return;
        }

        const track = state.playlist[state.currentIndex];

        if (track) {
            const fullState = {
                src: track.path,
                currentTime: audio.currentTime,
                isPlaying: !audio.paused,
                volume: state.volume,
                name: stripExt(track.name),
                type: track.type,
                currentIndex: state.currentIndex,
                playlist: state.playlist,
                repeat: state.repeat,
                shuffle: state.shuffle
            };

            try {
                localStorage.setItem('parnasocial:fullscreen:state', JSON.stringify(fullState));
            } catch (error) {
            }
        }

        window.parnasocial.fullscreen.open();
        videoModeBtn.blur();
    });
}

if (volumeBtn) {
    volumeBtn.addEventListener('click', () => {
        toggleMute();
        volumeBtn.blur();
    });
}

if (volumeInput) {
    volumeInput.addEventListener('input', () => {
        setVolumeValue(Number(volumeInput.value));
    });
}

if (openFolderBtn) {
    openFolderBtn.addEventListener('click', () => {
        openFolderAndAdd();
        openFolderBtn.blur();
    });
}

if (repeatFolderBtn) {
    repeatFolderBtn.addEventListener('click', () => {
        cycleRepeat();
        repeatFolderBtn.blur();
    });
}

if (shuffleFolderBtn) {
    shuffleFolderBtn.addEventListener('click', () => {
        toggleShuffle();
        shuffleFolderBtn.blur();
    });
}

if (folderToPlaylistBtn) {
    folderToPlaylistBtn.addEventListener('click', () => {
        addActiveFolderToPlaylist();
        folderToPlaylistBtn.blur();
    });
}

if (searchLeftBtn) {
    searchLeftBtn.addEventListener('click', () => {
        state.searchLeft = searchLeftInput ? searchLeftInput.value : '';
        renderDirectory();
        searchLeftBtn.blur();
    });
}

if (searchLeftInput) {
    searchLeftInput.addEventListener('input', () => {
        state.searchLeft = searchLeftInput.value;
        renderDirectory();
    });
}

if (openPlaylistBtn) {
    openPlaylistBtn.addEventListener('click', () => {
        addActiveFolderToPlaylist();
        openPlaylistBtn.blur();
    });
}

if (repeatPlaylistBtn) {
    repeatPlaylistBtn.addEventListener('click', () => {
        cycleRepeat();
        repeatPlaylistBtn.blur();
    });
}

if (shufflePlaylistBtn) {
    shufflePlaylistBtn.addEventListener('click', () => {
        toggleShuffle();
        shufflePlaylistBtn.blur();
    });
}

if (addPlaylistBtn) {
    addPlaylistBtn.addEventListener('click', () => {
        addFilesDialog();
        addPlaylistBtn.blur();
    });
}

if (addFolderPlaylistBtn) {
    addFolderPlaylistBtn.addEventListener('click', () => {
        addFolderDialog();
        addFolderPlaylistBtn.blur();
    });
}

if (searchRightBtn) {
    searchRightBtn.addEventListener('click', () => {
        state.searchRight = searchRightInput ? searchRightInput.value : '';
        renderPlaylist();
        searchRightBtn.blur();
    });
}

if (searchRightInput) {
    searchRightInput.addEventListener('input', () => {
        state.searchRight = searchRightInput.value;
        renderPlaylist();
    });
}

document.addEventListener('keydown', (event) => {
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
        setVolumeValue(state.volume + 5);
        return;
    }

    if (event.code === 'ArrowDown') {
        event.preventDefault();
        setVolumeValue(state.volume - 5);
        return;
    }

    if (event.code === 'KeyM') {
        event.preventDefault();
        toggleMute();
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
});

loadState();
applyVolume();
updateRepeatButtons();
updateShuffleButtons();
renderDirectory();
renderPlaylist();

if (state.currentIndex >= 0 && state.playlist.length > 0) {
    loadTrack(state.currentIndex, false);
}

(function handleReturnFromFullscreen() {
    try {
        const raw = localStorage.getItem('parnasocial:returnState');

        if (!raw) {
            return;
        }

        localStorage.removeItem('parnasocial:returnState');

        const data = JSON.parse(raw);

        if (typeof data.currentIndex === 'number') {
            state.currentIndex = data.currentIndex;
        }

        if (typeof data.volume === 'number') {
            state.volume = data.volume;
            state.savedVolume = data.volume > 0 ? data.volume : 70;
        }

        if (data.repeat === 'none' || data.repeat === 'all' || data.repeat === 'one') {
            state.repeat = data.repeat;
        }

        if (typeof data.shuffle === 'boolean') {
            state.shuffle = data.shuffle;
        }

        applyVolume();
        updateRepeatButtons();
        updateShuffleButtons();

        if (state.currentIndex >= 0 && state.playlist.length > 0) {
            loadTrack(state.currentIndex, false);

            if (typeof data.currentTime === 'number') {
                audio.currentTime = data.currentTime;
            }

            if (data.isPlaying) {
                audio.play().catch(() => {
                });
            }
        }
    } catch (error) {
    }
})();