document.addEventListener('DOMContentLoaded', () => {
    // ---- 1. Load & Apply Settings Globally ----
    loadSettings();


    // ---- 2. Initialize Inputs (Only if they exist) ----
    initInputs();

    // ---- Functions ----

    function saveSetting(key, value) {
        try {
            localStorage.setItem('parkicare_' + key, JSON.stringify(value));
            console.log(`ParkiCare Config: Saved ${key} =`, value);
        } catch (e) {
            console.error('ParkiCare Config: Error saving setting', e);
        }

        // Also re-apply immediately to see changes
        if (key === 'fontSize') applyFontSize(value);
        if (key === 'bigButtons') applyBigButtons(value);
        if (key === 'highContrast') applyHighContrast(value);
    }

    function getSetting(key, defaultValue) {
        try {
            const value = localStorage.getItem('parkicare_' + key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error('ParkiCare Config: Error getting setting', e);
            return defaultValue;
        }
    }

    function loadSettings() {
        console.log("ParkiCare Config: Loading settings...");
        const fontSize = getSetting('fontSize', 'medium');
        applyFontSize(fontSize);

        const bigButtons = getSetting('bigButtons', false);
        applyBigButtons(bigButtons);

        const highContrast = getSetting('highContrast', false);
        applyHighContrast(highContrast);
    }

    function initInputs() {
        // Font Size
        const fontSizeRadios = document.querySelectorAll('input[name="font-size"]');
        if (fontSizeRadios.length > 0) {
            checkRadio(fontSizeRadios, getSetting('fontSize', 'medium'));
            fontSizeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => saveSetting('fontSize', e.target.value));
            });
        }

        // Big Buttons
        const bigButtonsToggle = document.getElementById('big-buttons-toggle');
        if (bigButtonsToggle) {
            bigButtonsToggle.checked = getSetting('bigButtons', false);
            bigButtonsToggle.addEventListener('change', (e) => saveSetting('bigButtons', e.target.checked));
        }

        // High Contrast
        const highContrastToggle = document.getElementById('high-contrast-toggle');
        if (highContrastToggle) {
            highContrastToggle.checked = getSetting('highContrast', false);
            highContrastToggle.addEventListener('change', (e) => saveSetting('highContrast', e.target.checked));
        }

        // Alert Type
        const alertTypeRadios = document.querySelectorAll('input[name="alert-type"]');
        if (alertTypeRadios.length > 0) {
            checkRadio(alertTypeRadios, getSetting('alertType', 'sound-vibration'));
            alertTypeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => saveSetting('alertType', e.target.value));
            });
        }

        // Alarm Sound
        const alarmSoundSelect = document.getElementById('alarm-sound-select');
        let currentAudio = null; // Track currently playing sound

        if (alarmSoundSelect) {
            alarmSoundSelect.value = getSetting('alarmSound', 'padrao');
            alarmSoundSelect.addEventListener('change', (e) => {
                const selectedSound = e.target.value;
                saveSetting('alarmSound', selectedSound);

                // Play preview
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }

                // Assuming files are in the root directory: suave.mp3, padrao.mp3, estridente.mp3
                currentAudio = new Audio(`${selectedSound}.mp3`);
                currentAudio.play().catch(error => console.log("Audio file likely missing:", error));
            });
        }

        // Emergency Timer
        const emergencyTimerSelect = document.getElementById('emergency-timer-select');
        if (emergencyTimerSelect) {
            emergencyTimerSelect.value = getSetting('emergencyTimer', '10');
            emergencyTimerSelect.addEventListener('change', (e) => saveSetting('emergencyTimer', e.target.value));
        }

        // Emergency Message
        const emergencyMessage = document.getElementById('emergency-message');
        if (emergencyMessage) {
            emergencyMessage.value = getSetting('emergencyMessage', '');
            emergencyMessage.addEventListener('input', (e) => saveSetting('emergencyMessage', e.target.value));
        }
    }

    function checkRadio(nodelist, value) {
        nodelist.forEach(radio => {
            if (radio.value === value) radio.checked = true;
        });
    }

    // ---- Visual Application Functions ----

    function applyFontSize(size) {
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        if (size === 'small') document.body.classList.add('font-small');
        if (size === 'large') document.body.classList.add('font-large');
    }

    function applyBigButtons(enabled) {
        enabled ? document.body.classList.add('mode-big-buttons') : document.body.classList.remove('mode-big-buttons');
    }

    function applyHighContrast(enabled) {
        enabled ? document.body.classList.add('mode-high-contrast') : document.body.classList.remove('mode-high-contrast');
    }
});
