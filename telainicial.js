
// telainicial.js with Supabase Integration

let currentMedId = null;
let notificationTimeout = null;
const alertedMeds = new Set();
let currentDetailId = null;
let currentUser = null;

// Sound
function playSound() {
    try {
        // Get selected sound from settings, default to 'padrao'
        const savedSound = localStorage.getItem('parkicare_alarmSound');
        const soundName = savedSound ? JSON.parse(savedSound) : 'padrao';

        const audio = new Audio(`${soundName}.mp3`);
        audio.play().catch(e => console.error("Error playing alarm sound:", e));

        // Vibration fallback (if supported and enabled)
        const alertType = JSON.parse(localStorage.getItem('parkicare_alertType') || '"sound-vibration"');
        if (alertType !== 'sound-only' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
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
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'telalogin.html';
        return;
    }
    currentUser = session.user;
}

// ---------------------------------------------------------
// DATA FETCHING (SUPABASE)
// ---------------------------------------------------------

// Optimization: Cache meds to avoid fetching every second
let medicamentosCache = [];

async function getMedicamentos() {
    if (!currentUser) return [];
    try {
        const { data, error } = await window.supabaseClient
            .from('medicamentos')
            .select('*')
            .order('horario', { ascending: true });

        if (error) {
            console.error('Error fetching meds:', error);
            return [];
        }
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

        if (med.tomado) {
            cardClass += ' green';
            statusText = '<span style="color: #2ecc71;">Tomado</span>';
        } else if (isLate) {
            cardClass += ' red';
            statusText = 'atrasado';
        } else {
            cardClass += ' neutral';
        }

        const div = document.createElement('div');
        div.className = cardClass;
        div.style.animationDelay = `${index * 0.1}s`;

        if (!med.tomado && !isLate) {
            div.style.borderLeftColor = '#3498db';
        }

        div.onclick = () => abrirDetalhes(med.id);

        div.innerHTML = `
            <div class="med-info">
                ${med.nome}<br><small>${med.dosagem}${med.unidade || ''}</small>
            </div>
            <div class="med-time">
                ${med.horario}<br><small>${statusText}</small>
            </div>
        `;
        lista.appendChild(div);
    });
}

// ---------------------------------------------------------
// DETAILS MODAL
// ---------------------------------------------------------

async function abrirDetalhes(id) {
    const { data: med, error } = await window.supabaseClient
        .from('medicamentos')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !med) return;

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

    const { data: med } = await window.supabaseClient
        .from('medicamentos')
        .select('tomado, nome')
        .eq('id', currentDetailId)
        .single();

    if (!med) return;

    const novoStatus = !med.tomado;

    const { error } = await window.supabaseClient
        .from('medicamentos')
        .update({ tomado: novoStatus })
        .eq('id', currentDetailId);

    if (!error) {
        const acao = novoStatus ? 'Tomado (Manual)' : 'Desmarcado (Manual)';
        logHistory(currentDetailId, med.nome, acao);
        renderMedicamentos();
        fecharDetalhes();
    }
}

async function excluirMedicamento() {
    if (!currentDetailId) return;
    if (!confirm('Tem certeza que deseja excluir?')) return;

    const { error } = await window.supabaseClient
        .from('medicamentos')
        .delete()
        .eq('id', currentDetailId);

    if (!error) {
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
    // USE LOCAL CACHE instead of fetching Supabase
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
                showModal();
            }
        }
    });
}

function showModal() {
    const modal = document.getElementById('notification-modal');
    const button = document.querySelector('.notification-button');

    if (modal) {
        playSound();
        modal.classList.remove('hidden');

        let countdown = 10;
        if (button) {
            button.textContent = `Ok (${countdown}s)`;
        }

        if (notificationTimeout) clearTimeout(notificationTimeout);

        // Update countdown every second
        const countdownInterval = setInterval(() => {
            countdown--;
            if (button && countdown > 0) {
                button.textContent = `Ok (${countdown}s)`;
            }
        }, 1000);

        notificationTimeout = setTimeout(async () => {
            clearInterval(countdownInterval);
            if (currentMedId) {
                // Fetch name for log
                const { data: med } = await window.supabaseClient
                    .from('medicamentos')
                    .select('nome')
                    .eq('id', currentMedId)
                    .single();

                if (med) {
                    logHistory(currentMedId, med.nome, 'Não Tomado (Timeout)');
                }
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
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
    currentMedId = null;
}

async function confirmarTomada() {
    if (currentMedId) {
        // Update DB
        const { data: med } = await window.supabaseClient
            .from('medicamentos')
            .select('nome')
            .eq('id', currentMedId)
            .single();

        const { error } = await window.supabaseClient
            .from('medicamentos')
            .update({ tomado: true })
            .eq('id', currentMedId);

        if (!error && med) {
            logHistory(currentMedId, med.nome, 'Tomado (Notificação)');
            renderMedicamentos();
        }
    }
    closeModal();
}

async function logHistory(medId, medNome, status) {
    if (!currentUser) return;

    await window.supabaseClient
        .from('historico')
        .insert({
            user_id: currentUser.id,
            med_id: medId,
            med_nome: medNome,
            status: status,
            data_evento: new Date().toISOString()
        });
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
    btn.innerText = `(${emergencySeconds}s) cancelar`;

    modal.classList.remove('hidden');

    if (emergencyInterval) clearInterval(emergencyInterval);

    emergencyInterval = setInterval(() => {
        emergencySeconds--;
        if (emergencySeconds <= 0) {
            clearInterval(emergencyInterval);
            enviarEmergencia();
        } else {
            btn.innerText = `(${emergencySeconds}s) cancelar`;
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
    if (!currentUser || !currentUser.user_metadata) return;

    const meta = currentUser.user_metadata;
    const container = document.querySelector('.contact-list-clean');
    if (!container) return;

    container.innerHTML = '';

    // Contact 1
    if (meta.whatsapp) {
        container.innerHTML += `
           <div class="contact-item">
            <strong>Contato 1</strong>
            <small>${meta.whatsapp}</small>
          </div>
        `;
    }

    // Contact 2
    if (meta.whatsapp2) {
        container.innerHTML += `
           <div class="contact-item">
            <strong>Contato 2</strong>
            <small>${meta.whatsapp2}</small>
          </div>
        `;
    }
}

function enviarEmergencia() {
    cancelarEmergencia();

    if (!currentUser || !currentUser.user_metadata) {
        alert("Erro: Usuário não identificado.");
        return;
    }

    const meta = currentUser.user_metadata;

    // Get custom message or default
    const savedMsg = localStorage.getItem('parkicare_emergencyMessage');
    let message = "SOCORRO! Preciso de ajuda urgente!";
    if (savedMsg) {
        try {
            const parsed = JSON.parse(savedMsg);
            if (parsed && parsed.trim() !== "") message = parsed;
        } catch (e) {
            console.error("Error parsing saved message", e);
        }
    }
    const encodedMsg = encodeURIComponent(message);

    // Prioritize Contact 1
    if (meta.whatsapp) {
        const url1 = `https://wa.me/55${meta.whatsapp}?text=${encodedMsg}`; // Assuming BR code 55 for simplicity
        window.open(url1, '_blank');
    }

    // Process Contact 2 (Browser might block specific popup, but we try)
    if (meta.whatsapp2) {
        setTimeout(() => {
            const url2 = `https://wa.me/55${meta.whatsapp2}?text=${encodedMsg}`;
            window.open(url2, '_blank');
        }, 1000);
    }

    // Fallback if no contacts
    if (!meta.whatsapp && !meta.whatsapp2) {
        const url = `https://wa.me/?text=${encodedMsg}`;
        window.open(url, '_blank');
    }
}
