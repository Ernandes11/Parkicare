// Funções para Modal de Contato (podem ser acessadas no onclick do HTML)
function abrirModalContato() {
    const modal = document.getElementById('modal-contato');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function fecharModalContato() {
    const modal = document.getElementById('modal-contato');
    if (modal) {
        modal.classList.add('hidden');
    }
}

let currentUser = null;

async function checkAuth() {
    if (!window.supabaseClient) return;
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        renderSavedContacts();
    }
}

function renderSavedContacts() {
    const listDiv = document.getElementById('lista-contatos-config');
    if (!listDiv || !currentUser) return;

    const meta = currentUser.user_metadata || {};
    listDiv.innerHTML = '';

    if (meta.whatsapp) {
        listDiv.innerHTML += `
            <div class="contact-pill">
                <span><strong>${meta.nome_contato || 'Contato 1'}:</strong> ${meta.whatsapp}</span>
                <button class="remove-pill" onclick="removerContato(1)">×</button>
            </div>
        `;
    }
    if (meta.whatsapp2) {
        listDiv.innerHTML += `
            <div class="contact-pill">
                <span><strong>${meta.nome_contato2 || 'Contato 2'}:</strong> ${meta.whatsapp2}</span>
                <button class="remove-pill" onclick="removerContato(2)">×</button>
            </div>
        `;
    }
}

async function salvarContato() {
    const nome = document.getElementById('novo-nome').value.trim();
    let contato = document.getElementById('novo-contato-tel').value.trim();
    
    // Limpeza: Manter apenas números
    contato = contato.replace(/\D/g, '');

    if (!nome || !contato) {
        alert("Preencha todos os campos.");
        return;
    }

    // Se não tiver 55 (Brasil) no começo, e tiver tamanho de celular BR, adiciona 55
    if (contato.length >= 10 && !contato.startsWith('55')) {
        contato = '55' + contato;
    }

    if (!currentUser) {
        alert("Você precisa estar logado para salvar contatos.");
        return;
    }

    const meta = currentUser.user_metadata || {};
    let updates = {};

    // Determine if we save as contact 1 or 2
    if (!meta.whatsapp) {
        updates = { whatsapp: contato, nome_contato: nome };
    } else if (!meta.whatsapp2) {
        updates = { whatsapp2: contato, nome_contato2: nome };
    } else {
        alert("Limite de 2 contatos atingido. Remova um para adicionar outro.");
        return;
    }

    try {
        const { data, error } = await window.supabaseClient.auth.updateUser({
            data: updates
        });

        if (error) throw error;
        
        currentUser = data.user; // Update local user state
        alert("Contato salvo com sucesso!");
        document.getElementById('novo-nome').value = '';
        document.getElementById('novo-contato-tel').value = '';
        fecharModalContato();
        renderSavedContacts();
    } catch (err) {
        console.error("Erro ao salvar contato:", err);
        alert("Erro ao salvar no banco de dados.");
    }
}

async function removerContato(num) {
    if (!currentUser) return;
    
    let updates = {};
    if (num === 1) {
        updates = { whatsapp: null, nome_contato: null };
    } else {
        updates = { whatsapp2: null, nome_contato2: null };
    }

    try {
        const { data, error } = await window.supabaseClient.auth.updateUser({
            data: updates
        });
        if (error) throw error;
        currentUser = data.user;
        renderSavedContacts();
    } catch (err) {
        console.error("Erro ao remover:", err);
    }
}

// Escopo Privado para inicialização padrão
document.addEventListener('DOMContentLoaded', () => {

    // ---- 1. Load & Apply Settings Globally ----
    loadSettings();

    // ---- 2. Initialize Inputs ----
    initInputs();
    checkAuth();

    // ---- Functions ----

    function saveSetting(key, value) {
        try {
            localStorage.setItem('parkicare_' + key, JSON.stringify(value));
            console.log(`ParkiCare Config: Saved ${key} =`, value);
        } catch (e) {
            console.error('ParkiCare Config: Error saving setting', e);
        }

        // Apply globally using the loader motor
        if (window.refreshAccessibility) {
            window.refreshAccessibility();
        }
    }

    function getSetting(key, defaultValue) {
        try {
            const value = localStorage.getItem('parkicare_' + key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    function loadSettings() {
        applyFontSize(getSetting('fontSize', 'medium'));
        applyBtnSize(getSetting('btnSize', 'medium'));
        applyHighContrast(getSetting('highContrast', false));
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

        // Button Size (NOVO)
        const btnSizeRadios = document.querySelectorAll('input[name="btn-size"]');
        if (btnSizeRadios.length > 0) {
            checkRadio(btnSizeRadios, getSetting('btnSize', 'medium'));
            btnSizeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => saveSetting('btnSize', e.target.value));
            });
        }

        // High Contrast
        const highContrastToggle = document.getElementById('high-contrast-toggle');
        if (highContrastToggle) {
            highContrastToggle.checked = getSetting('highContrast', false);
            highContrastToggle.addEventListener('change', (e) => saveSetting('highContrast', e.target.checked));
        }

        // Alarm Sound
        const alarmSoundSelect = document.getElementById('alarm-sound-select');
        let currentAudio = null; 

        if (alarmSoundSelect) {
            alarmSoundSelect.value = getSetting('alarmSound', 'padrao');
            alarmSoundSelect.addEventListener('change', (e) => {
                const selectedSound = e.target.value;
                saveSetting('alarmSound', selectedSound);

                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }
                currentAudio = new Audio(`assets/audio/${selectedSound}.mp3`);
                currentAudio.play().catch(error => console.log("Audio file likely missing:", error));
            });
        }

        // Emergency Timer
        const emergencyTimerSelect = document.getElementById('emergency-timer-select');
        if (emergencyTimerSelect) {
            emergencyTimerSelect.value = getSetting('emergencyTimer', '10');
            emergencyTimerSelect.addEventListener('change', (e) => saveSetting('emergencyTimer', e.target.value));
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

    function applyBtnSize(size) {
        document.body.classList.remove('btn-small', 'btn-medium', 'btn-large', 'mode-big-buttons');
        if (size === 'small') document.body.classList.add('btn-small');
        if (size === 'large') document.body.classList.add('btn-large', 'mode-big-buttons'); // Preserva CSS antigo do botao grande se ele existir
    }

    function applyHighContrast(enabled) {
        enabled ? document.body.classList.add('mode-high-contrast') : document.body.classList.remove('mode-high-contrast');
    }
});
