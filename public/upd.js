document.addEventListener('DOMContentLoaded', () => {
    const updaterApi = window.parnasocial && window.parnasocial.updater ? window.parnasocial.updater : null;

    if (!updaterApi) {
        console.error('Updater API is not available in preload');
        return;
    }

    function createOverlay(className) {
        const overlay = document.createElement('div');
        overlay.className = className;
        overlay.style.display = 'none';
        document.body.appendChild(overlay);
        return overlay;
    }

    function createCard(overlay) {
        const card = document.createElement('div');
        card.className = 'pred';
        overlay.appendChild(card);
        return card;
    }

    function createHeading(card, text) {
        const heading = document.createElement('h1');
        heading.textContent = text;
        card.appendChild(heading);
        return heading;
    }

    function createParagraph(card, text) {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        card.appendChild(paragraph);
        return paragraph;
    }

    function createRow(card) {
        const row = document.createElement('div');
        row.className = 'row';
        card.appendChild(row);
        return row;
    }

    function createButton(row, className, id, text) {
        const button = document.createElement('button');
        button.type = 'button';
        if (className) {
            button.className = className;
        }
        button.id = id;
        button.textContent = text;
        row.appendChild(button);
        return button;
    }

    // function applyFallbackStyles(overlay, card, heading, description, row, primaryButton, secondaryButton) {
    //     const overlayStyles = window.getComputedStyle(overlay);
    //
    //     if (overlayStyles.position !== 'static') {
    //         return;
    //     }
    //
    //     overlay.dataset.fallback = 'true';
    //     overlay.style.position = 'fixed';
    //     overlay.style.top = '0';
    //     overlay.style.left = '0';
    //     overlay.style.right = '0';
    //     overlay.style.bottom = '0';
    //     overlay.style.alignItems = 'center';
    //     overlay.style.justifyContent = 'center';
    //     overlay.style.padding = '24px';
    //     overlay.style.boxSizing = 'border-box';
    //     overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.65)';
    //     overlay.style.zIndex = '10000';
    //
    //     card.style.backgroundColor = '#161616';
    //     card.style.color = '#ffffff';
    //     card.style.padding = '24px';
    //     card.style.borderRadius = '6px';
    //     card.style.maxWidth = '480px';
    //     card.style.width = '100%';
    //     card.style.boxSizing = 'border-box';
    //
    //     heading.style.fontSize = '18px';
    //     heading.style.fontWeight = '600';
    //     heading.style.margin = '0 0 8px 0';
    //
    //     description.style.fontSize = '14px';
    //     description.style.lineHeight = '1.5';
    //     description.style.opacity = '0.75';
    //     description.style.margin = '0 0 16px 0';
    //
    //     row.style.display = 'flex';
    //     row.style.gap = '10px';
    //     row.style.justContent = 'flex-end';
    //     row.style.justifyContent = 'flex-end';
    //
    //     primaryButton.style.backgroundColor = '#ffffff';
    //     primaryButton.style.color = '#101010';
    //     primaryButton.style.border = 'none';
    //     primaryButton.style.borderRadius = '4px';
    //     primaryButton.style.padding = '10px 18px';
    //     primaryButton.style.fontSize = '14px';
    //     primaryButton.style.fontWeight = '600';
    //     primaryButton.style.cursor = 'pointer';
    //
    //     secondaryButton.style.backgroundColor = '#242424';
    //     secondaryButton.style.color = '#ffffff';
    //     secondaryButton.style.border = 'none';
    //     secondaryButton.style.borderRadius = '4px';
    //     secondaryButton.style.padding = '10px 18px';
    //     secondaryButton.style.fontSize = '14px';
    //     secondaryButton.style.fontWeight = '600';
    //     secondaryButton.style.cursor = 'pointer';
    //
    //     primaryButton.addEventListener('mouseenter', () => {
    //         primaryButton.style.backgroundColor = '#e6e6e6';
    //     });
    //
    //     primaryButton.addEventListener('mouseleave', () => {
    //         primaryButton.style.backgroundColor = '#ffffff';
    //     });
    //
    //     secondaryButton.addEventListener('mouseenter', () => {
    //         secondaryButton.style.backgroundColor = '#303030';
    //     });
    //
    //     secondaryButton.addEventListener('mouseleave', () => {
    //         secondaryButton.style.backgroundColor = '#242424';
    //     });
    // }

    function showOverlay(overlay) {
        overlay.classList.remove('hidden');
        overlay.style.display = overlay.dataset.fallback === 'true' ? 'flex' : '';
    }

    function hideOverlay(overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }

    const availableOverlay = createOverlay('pred3cont');
    const availableCard = createCard(availableOverlay);
    const availableHeading = createHeading(availableCard, 'Update available, update?');
    const availableDescription = createParagraph(availableCard, 'Once the download is complete, we will prompt you to restart.');
    const availableRow = createRow(availableCard);
    const updateButton = createButton(availableRow, 'restart', 'update', 'Update');
    const skipAvailableButton = createButton(availableRow, '', 'skip3', 'Skip');
    const progressParagraph = document.createElement('p');
    // progressParagraph.id = 'update-progress-text';
    // progressParagraph.style.marginTop = '8px';
    // progressParagraph.style.fontSize = '14px';
    // progressParagraph.style.opacity = '0.7';
    // availableCard.appendChild(progressParagraph);

    const restartOverlay = createOverlay('pred2cont');
    const restartCard = createCard(restartOverlay);
    const restartHeading = createHeading(restartCard, 'To complete the update, you need to restart the application.');
    const restartDescription = createParagraph(restartCard, 'All data and information will be preserved');
    const restartRow = createRow(restartCard);
    const restartButton = createButton(restartRow, 'restart', 'restart1', 'Restart');
    const skipRestartButton = createButton(restartRow, '', 'skip2', 'Skip');
    //
    // applyFallbackStyles(availableOverlay, availableCard, availableHeading, availableDescription, availableRow, updateButton, skipAvailableButton);
    // applyFallbackStyles(restartOverlay, restartCard, restartHeading, restartDescription, restartRow, restartButton, skipRestartButton);

    hideOverlay(availableOverlay);
    hideOverlay(restartOverlay);

    function resetUpdateButton() {
        updateButton.disabled = false;
        updateButton.textContent = 'Update';
    }

    updateButton.addEventListener('click', () => {
        updateButton.disabled = true;
        updateButton.textContent = 'Downloading...';
        // progressParagraph.textContent = 'Downloading: 0%';
        updaterApi.download();
    });

    skipAvailableButton.addEventListener('click', () => {
        hideOverlay(availableOverlay);
        resetUpdateButton();
        // progressParagraph.textContent = '';
    });

    restartButton.addEventListener('click', () => {
        updaterApi.quitAndInstall();
    });

    skipRestartButton.addEventListener('click', () => {
        hideOverlay(restartOverlay);
    });

    updaterApi.onAvailable((version) => {
        availableHeading.textContent = 'New version ' + version + ' found, update?';
        resetUpdateButton();
        // progressParagraph.textContent = '';
        hideOverlay(restartOverlay);
        showOverlay(availableOverlay);
    });

    // updaterApi.onProgress((percent) => {
    //     progressParagraph.textContent = 'Downloading: ' + Math.round(percent) + '%';
    // });

    updaterApi.onDownloaded(() => {
        hideOverlay(availableOverlay);
        showOverlay(restartOverlay);
    });

    updaterApi.onError((message) => {
        console.error('Update error:', message);
        resetUpdateButton();
        // if (availableOverlay.style.display !== 'none') {
        //     progressParagraph.textContent = 'Update error: ' + message;
        // }
    });

    updaterApi.check();
});