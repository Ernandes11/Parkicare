
// telainicial.js with Supabase Integration

let currentMedId = null;
let notificationTimeout = null;
const alertedMeds = new Set();
let currentDetailId = null;
let currentUser = null;

// Sound
const beepUrl = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU";

function playSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
            osc.stop(ctx.currentTime + 0.5);
        }
    } catch (e) {
        console.error("Audio play failed", e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    if (currentUser) {
        renderMedicamentos();
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

async function getMedicamentos() {
    if (!currentUser) return [];
    const { data, error } = await window.supabaseClient
        .from('medicamentos')
        .select('*')
        .order('horario', { ascending: true });

    if (error) {
        console.error('Error fetching meds:', error);
        return [];
    }
    return data;
}

async function renderMedicamentos() {
    const lista = document.getElementById('lista-medicamentos');
    if (!lista) return;

    lista.innerHTML = '<p style="text-align: center;">Carregando...</p>';

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
        const [medHours, medMinutes] = med.horario.split(':').map(Number);

        let isLate = false;
        if (!med.tomado) {
            if (currentHours > medHours || (currentHours === medHours && currentMinutes > medMinutes)) {
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
        // Stagger animation
        div.style.animationDelay = `${index * 0.1}s`;

        if (!med.tomado && !isLate) {
            div.style.borderLeftColor = '#3498db';
        }

        // Open details modal
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
    // We can fetch singular or just find from fresh list
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

    // First get current status
    const { data: med } = await window.supabaseClient
        .from('medicamentos')
        .select('tomado, nome')
        .eq('id', currentDetailId)
        .single();

    if (!med) return;

    const novoStatus = !med.tomado;

    // Update DB
    const { error } = await window.supabaseClient
        .from('medicamentos')
        .update({ tomado: novoStatus })
        .eq('id', currentDetailId);

    if (!error) {
        // Log History
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
    // Ideally we shouldn't fetch all every second, but for this scale it's fine.
    // Optimization: Store in local variable and update locally, only sync occasionally.
    // For now, let's just check the data we already rendered if possible or fetch fresh.
    // To ensure reliability, we fetch fresh.

    const medicamentos = await getMedicamentos(); // Getting fresh data
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    medicamentos.forEach(med => {
        if (med.tomado) return;

        const [medHours, medMinutes] = med.horario.split(':').map(Number);

        if (currentHours === medHours && currentMinutes === medMinutes) {
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
    if (modal) {
        playSound();
        modal.classList.remove('hidden');
        if (notificationTimeout) clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(async () => {
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
    emergencySeconds = 10;
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

function enviarEmergencia() {
    cancelarEmergencia();
    // WhatsApp Panic Message
    const message = "SOCORRO! Preciso de ajuda urgente!";
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
}
