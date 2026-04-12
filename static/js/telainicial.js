
// telainicial.js - Flask Integration

let currentMedId = null;
let notificationTimeout = null;
const alertedMeds = new Set();
let currentDetailId = null;
let currentUser = null;
let currentAlarmAudio = null; // Store audio reference to stop it later

// Sound
function playSound() {
    try {
        // Stop any existing sound before playing new one
        if (currentAlarmAudio) {
            currentAlarmAudio.pause();
            currentAlarmAudio.currentTime = 0;
        }

        const savedSound = localStorage.getItem('parkicare_alarmSound');
        const soundName = savedSound ? JSON.parse(savedSound) : 'padrao';

        currentAlarmAudio = new Audio(`/static/audio/${soundName}.mp3`);
        currentAlarmAudio.loop = true; // Optional: keep playing until action
        currentAlarmAudio.play().catch(e => console.error("Error playing alarm sound:", e));

        const alertType = JSON.parse(localStorage.getItem('parkicare_alertType') || '"sound-vibration"');
        if (alertType !== 'sound-only' && navigator.vibrate) {
            navigator.vibrate([400, 200, 400]);
        }
    } catch (e) {
        console.error("Audio play failed", e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    if (currentUser) {
        renderMedicamentos();
        renderEmergencyContacts(); // New function
        setInterval(checkNotifications, 1000);
    }
});

async function checkAuth() {
    const token = localStorage.getItem('parkicare_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch('/api/perfil', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            // Se falhou (401 ou 422), limpa o token e volta ao login
            localStorage.removeItem('parkicare_token');
            window.location.href = '/login';
            return;
        }
        currentUser = await response.json();
    } catch (e) {
        console.error("Auth check failed:", e);
        localStorage.removeItem('parkicare_token');
        window.location.href = '/login';
    }
}

// ---------------------------------------------------------
// DATA FETCHING (Flask API)
// ---------------------------------------------------------

// Optimization: Cache meds to avoid fetching every second
let medicamentosCache = [];

async function getMedicamentos() {
    if (!currentUser) return [];
    try {
        const token = localStorage.getItem('parkicare_token');
        const response = await fetch('/api/medicamentos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            console.error('Error fetching meds');
            return [];
        }
        
        const data = await response.json();
        medicamentosCache = data || []; // Update cache
        return data;
    } catch (e) {
        console.error("Exception fetching meds:", e);
        return [];
    }
}

async function renderMedicamentos() {
    const lista = document.getElementById('lista-medicamentos');
    if (!lista) return;

    lista.innerHTML = '<p style="text-align: center;">Carregando...</p>';

    // Fetch fresh data once during render
    const medicamentos = await getMedicamentos();
    lista.innerHTML = '';

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    if (medicamentos.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #666;">Nenhum medicamento agendado.</p>';
        return;
    }

    medicamentos.forEach((med, index) => {
        // Calculate status based on current time
        // Note: Ideally we should calculate "next dose" here, but for simple display we show the base schedule
        // or check if the specific dose time has passed.

        let isLate = false;
        // Simple logic for "late" - if base time passed and not taken.
        // Complex interval logic would require calculating specific instances.
        const [medHours, medMinutes] = med.horario.split(':').map(Number);

        if (!med.tomado) {
            if (currentHours > medHours || (currentHours === medHours && currentMinutes > medMinutes)) {
                isLate = true;
            } else if (alertedMeds.has(med.id)) {
                isLate = true;
            }
        }

        let cardClass = 'med-card';
        let statusText = '';
        let statusClass = '';

        if (med.tomado) {
            statusText = 'Tomado';
            statusClass = 'tomado';
        } else if (isLate) {
            statusText = 'Atrasado';
            statusClass = 'atrasado';
        } else {
            statusText = 'Pendente';
            statusClass = ''; // Default/Neutral
        }

        const div = document.createElement('div');
        div.className = 'new-med-card';
        div.style.animationDelay = `${index * 0.1}s`;

        div.onclick = () => abrirDetalhes(med.id);

        div.innerHTML = `
            <div class="new-med-time">
                ${med.horario}
            </div>
            <div class="new-med-info">
                <h4>${med.nome}</h4>
                <p>${med.dosagem}${med.unidade || ''}</p>
            </div>
            <div class="status-badge ${statusClass}">
                ${statusText}
            </div>
        `;
        lista.appendChild(div);
    });
}

// ---------------------------------------------------------
// DETAILS MODAL
// ---------------------------------------------------------

async function abrirDetalhes(id) {
    const token = localStorage.getItem('parkicare_token');
    const response = await fetch('/api/medicamentos', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const meds = await response.json();
    const med = meds.find(m => m.id === id);

    if (!med) return;

    currentDetailId = id;
    document.getElementById('detail-nome').innerText = med.nome;

    const info = `
        Horário: ${med.horario}<br>
        Dosagem: ${med.dosagem}${med.unidade || ''}<br>
        Intervalo: ${med.intervalo || '-'}<br>
        Status: ${med.tomado ? 'Tomado' : 'Pendente'}
    `;
    document.getElementById('detail-info').innerHTML = info;

    const btn = document.getElementById('btn-toggle-status');
    if (med.tomado) {
        btn.innerText = 'Desmarcar';
        btn.classList.remove('btn-success');
        btn.style.backgroundColor = '#999';
    } else {
        btn.innerText = 'Marcar como Tomado';
        btn.classList.add('btn-success');
        btn.style.backgroundColor = '';
    }

    document.getElementById('details-modal').classList.remove('hidden');
}

function fecharDetalhes() {
    document.getElementById('details-modal').classList.add('hidden');
    currentDetailId = null;
}

async function alternarStatusDetalhe() {
    if (!currentDetailId) return;

    try {
        const token = localStorage.getItem('parkicare_token');
        const response = await fetch(`/api/medicamentos/${currentDetailId}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tomado: undefined }) // Let backend toggle
        });

        if (response.ok) {
            renderMedicamentos();
            fecharDetalhes();
        }
    } catch (e) {
        console.error("Error toggling status:", e);
    }
}

async function excluirMedicamento() {
    if (!currentDetailId) return;
    if (!confirm('Tem certeza que deseja excluir?')) return;

    const token = localStorage.getItem('parkicare_token');
    const response = await fetch(`/api/medicamentos/${currentDetailId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
        renderMedicamentos();
        fecharDetalhes();
    } else {
        alert('Erro ao excluir medicamento.');
    }
}

// ---------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------

async function checkNotifications() {
    // USE LOCAL CACHE instead of fetching from server every second
    // medicamentosCache is updated whenever renderMedicamentos() is called (on load or after actions)

    if (medicamentosCache.length === 0) return;

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    medicamentosCache.forEach(med => {
        if (med.tomado) return;

        // Base time
        const [startH, startM] = med.horario.split(':').map(Number);

        // Calculate all dose times for the day based on interval
        let doseTimes = [];
        let interval = parseInt(med.intervalo) || 0;

        if (interval > 0) {
            // Add start time and subsequent intervals until end of day (24h)
            let tempH = startH;
            let tempM = startM; // Assuming minutes don't change for now, or simplistic 
            // Better to convert to minutes for calculation
            let minutesOfDay = startH * 60 + startM;

            while (minutesOfDay < 24 * 60) {
                doseTimes.push(minutesOfDay);
                minutesOfDay += interval * 60;
            }
        } else {
            // Just the one time
            doseTimes.push(startH * 60 + startM);
        }

        // Compare current time with any of doseTimes
        const currentTotalMinutes = currentHours * 60 + currentMinutes;

        // Check if ANY calculated dose time matches NOW
        const match = doseTimes.some(totalMins => totalMins === currentTotalMinutes);

        if (match) {
            // Check uniqueness of alert (med.id + time?)
            // For simplicity, just check med.id. If they have to take it twice a day, 
            // locking by ID means valid for only one alert session. 
            // Optimization: Add time to alerted key or reset alertedMeds daily/on complete.
            // Current simplistic logic:
            if (!alertedMeds.has(med.id)) {
                alertedMeds.add(med.id);
                currentMedId = med.id;
                showModal(med.id, med.nome);
            }
        }
    });
}

function showModal(medId, medNome) {
    const modal = document.getElementById('notification-modal');
    const button = document.querySelector('.notification-button');

    if (modal) {
        playSound();
        modal.classList.remove('hidden');

        let countdown = 10;
        if (button) {
            button.textContent = `Confirmar (${countdown}s)`;
        }

        if (notificationTimeout) clearTimeout(notificationTimeout);

        // Update countdown every second
        const countdownInterval = setInterval(() => {
            countdown--;
            if (button && countdown > 0) {
                button.textContent = `Confirmar (${countdown}s)`;
            }
        }, 1000);

        notificationTimeout = setTimeout(async () => {
            clearInterval(countdownInterval);
            if (medId) {
                logHistory(medId, medNome, 'Não Tomado (Timeout)');
            }
            closeModal();
            renderMedicamentos();
        }, 10000);
    }
}

function closeModal() {
    const modal = document.getElementById('notification-modal');
    if (modal) {
        modal.classList.add('hidden');
    }

    // STOP the music!
    if (currentAlarmAudio) {
        currentAlarmAudio.pause();
        currentAlarmAudio.currentTime = 0;
        currentAlarmAudio = null;
    }

    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
    currentMedId = null;
}

async function confirmarTomada() {
    if (currentMedId) {
        const token = localStorage.getItem('parkicare_token');
        const response = await fetch(`/api/medicamentos/${currentMedId}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tomado: true })
        });

        if (response.ok) {
            renderMedicamentos();
        }
    }
    closeModal();
}

async function logHistory(medId, medNome, status) {
    // Optional for now or implemented via separate activity endpoint
}

// ---------------------------------------------------------
// OTHER FEATURES
// ---------------------------------------------------------

function irPara(pagina) {
    if (pagina === 'emergencia.html') {
        abrirEmergencia();
    } else {
        window.location.href = pagina;
    }
}

// Emergency Logic
let emergencyInterval = null;
let emergencySeconds = 10;

function abrirEmergencia() {
    const modal = document.getElementById('emergency-modal');
    if (!modal) return;

    // Reset state
    const savedTime = localStorage.getItem('parkicare_emergencyTimer');
    emergencySeconds = savedTime ? parseInt(JSON.parse(savedTime)) : 10;
    const btn = document.getElementById('btn-cancel-emergency');
    if (btn) btn.innerText = `(${emergencySeconds}s) Cancelar`;

    modal.classList.remove('hidden');
    renderEmergencyContacts(); // Refresh list on open

    if (emergencyInterval) clearInterval(emergencyInterval);

    emergencyInterval = setInterval(() => {
        emergencySeconds--;
        if (emergencySeconds <= 0) {
            clearInterval(emergencyInterval);
            enviarEmergencia();
        } else {
            if (btn) btn.innerText = `(${emergencySeconds}s) Cancelar`;
        }
    }, 1000);
}

function cancelarEmergencia() {
    const modal = document.getElementById('emergency-modal');
    if (modal) modal.classList.add('hidden');
    if (emergencyInterval) clearInterval(emergencyInterval);
}

// ---------------------------------------------------------
// EMERGENCY CONTACTS & LOGIC
// ---------------------------------------------------------

function renderEmergencyContacts() {
    if (!currentUser) return;

    const container = document.getElementById('badge-contatos-emergencia');
    if (!container) return;

    container.innerHTML = '';

    // Contact 1
    if (currentUser.whatsapp) {
        const nome = currentUser.nome_contato || 'Contato 1';
        container.innerHTML += `<div class="contact-badge">${nome}: ${formatarTel(currentUser.whatsapp)}</div>`;
    }

    // Contact 2
    if (currentUser.whatsapp2) {
        const nome2 = currentUser.nome_contato2 || 'Contato 2';
        container.innerHTML += `<div class="contact-badge">${nome2}: ${formatarTel(currentUser.whatsapp2)}</div>`;
    }

    if (!currentUser.whatsapp && !currentUser.whatsapp2) {
        container.innerHTML = '<p style="color:red">Nenhum contato configurado!</p>';
    }
}

function formatarTel(tel) {
    if (!tel) return '';
    let t = tel.replace(/\D/g, '');
    if (t.startsWith('55')) t = t.substring(2);
    if (t.length === 11) {
        return `+55 ${t.substring(0, 2)} ${t.substring(2, 7)}-${t.substring(7)}`;
    }
    return tel;
}

async function enviarEmergencia() {
    cancelarEmergencia();

    // 1. Registrar alerta no Servidor Flask
    try {
        const token = localStorage.getItem('parkicare_token');
        await fetch('/api/emergencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ timestamp: new Date().toISOString(), tipo: 'emergencia' })
        });
    } catch (e) {
        console.log("Servidor Flask offline ou erro na API de emergência:", e);
    }

    // 2. Lógica Original WhatsApp
    if (!currentUser) {
        alert("Erro: Usuário não identificado.");
        return;
    }

    const message = "SOCORRO! Preciso de ajuda urgente!";
    const encodedMsg = encodeURIComponent(message);

    const contatos = [];
    if (currentUser.whatsapp) contatos.push(currentUser.whatsapp);
    if (currentUser.whatsapp2) contatos.push(currentUser.whatsapp2);

    if (contatos.length === 0) {
        const url = `https://wa.me/?text=${encodedMsg}`;
        window.open(url, '_blank');
        return;
    }

    contatos.forEach((tel, index) => {
        setTimeout(() => {
            const cleanNum = tel.replace(/\D/g, '');
            const url = `https://wa.me/${cleanNum}?text=${encodedMsg}`;
            window.open(url, '_blank');
        }, index * 1000);
    });
}
