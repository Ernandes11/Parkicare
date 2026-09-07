// telacuidador.js
let alertPollInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    await carregarPerfil();
    await carregarPacientesVinculados();
    await carregarAlertas();

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (alertPollInterval) clearInterval(alertPollInterval);
            localStorage.removeItem('parkicare_token');
            localStorage.removeItem('parkicare_user_id');
            localStorage.removeItem('parkicare_tipo');
            window.location.href = '/login';
        });
    }

    const btnVincular = document.getElementById('btn-vincular');
    if (btnVincular) {
        btnVincular.addEventListener('click', vincularPaciente);
    }
    const inputCodigo = document.getElementById('input-codigo-vinculo');
    if (inputCodigo) {
        inputCodigo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') vincularPaciente();
        });
    }

    // Enquanto a tela do cuidador estiver aberta, verifica novos alertas
    // periodicamente — é assim que o cuidador "recebe" o alerta de
    // emergência do paciente vinculado, em tempo quase real.
    alertPollInterval = setInterval(carregarAlertas, 8000);
});

function getToken() {
    return localStorage.getItem('parkicare_token');
}

async function carregarPerfil() {
    const token = getToken();
    const titleEl = document.getElementById('welcome-title');
    const textEl = document.getElementById('welcome-text');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch('/api/perfil', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }

        if (response.ok) {
            const user = await response.json();

            // Verifica se é realmente um cuidador
            if (user.tipo !== 'cuidador') {
                window.location.href = '/inicial';
                return;
            }

            if (titleEl) titleEl.textContent = `Olá, ${user.nome}!`;
            if (textEl) textEl.textContent = 'Acompanhe seus pacientes vinculados aqui.';
        }
    } catch (err) {
        console.error('Erro ao carregar perfil do cuidador:', err);
    }
}

async function vincularPaciente() {
    const token = getToken();
    const input = document.getElementById('input-codigo-vinculo');
    const errorEl = document.getElementById('vinculo-error');
    const btn = document.getElementById('btn-vincular');
    if (errorEl) errorEl.textContent = '';

    if (!token) {
        if (errorEl) errorEl.textContent = 'Faça login para se vincular a um paciente.';
        return;
    }

    const codigo = (input?.value || '').trim();
    if (!codigo) {
        if (errorEl) errorEl.textContent = 'Digite o código do paciente.';
        return;
    }

    if (btn) btn.disabled = true;
    try {
        const response = await fetch('/api/vinculo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ codigo })
        });
        const result = await response.json();

        if (!response.ok) {
            if (errorEl) errorEl.textContent = result.erro || 'Não foi possível vincular.';
            return;
        }

        if (input) input.value = '';
        await carregarPacientesVinculados();
        await carregarAlertas();
    } catch (err) {
        console.error('Erro ao vincular paciente:', err);
        if (errorEl) errorEl.textContent = 'Erro de conexão. Tente novamente.';
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function carregarPacientesVinculados() {
    const token = getToken();
    const listEl = document.getElementById('patients-list');
    const emptyCard = document.getElementById('patient-card');
    if (!token || !listEl) return;

    try {
        const response = await fetch('/api/vinculo/pacientes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;
        const pacientes = await response.json();

        listEl.innerHTML = '';

        if (pacientes.length === 0) {
            if (emptyCard) emptyCard.style.display = '';
            return;
        }

        if (emptyCard) emptyCard.style.display = 'none';

        pacientes.forEach(p => {
            const card = document.createElement('div');
            card.className = 'patient-pill';
            card.innerHTML = `
                <span><strong>${p.nome}</strong></span>
                <div class="patient-pill-actions">
                    <a class="btn-med-link" href="/medicamentos?paciente_id=${p.id}&nome=${encodeURIComponent(p.nome)}">Remédios</a>
                    <button class="remove-link" title="Remover vínculo" data-vinculo-id="${p.vinculo_id}">×</button>
                </div>
            `;
            card.querySelector('.remove-link').addEventListener('click', () => removerVinculo(p.vinculo_id));
            listEl.appendChild(card);
        });
    } catch (err) {
        console.error('Erro ao carregar pacientes vinculados:', err);
    }
}

async function removerVinculo(vinculoId) {
    const token = getToken();
    if (!token) return;
    try {
        await fetch(`/api/vinculo/${vinculoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await carregarPacientesVinculados();
        await carregarAlertas();
    } catch (err) {
        console.error('Erro ao remover vínculo:', err);
    }
}

async function carregarAlertas() {
    const token = getToken();
    const listEl = document.getElementById('alerts-list');
    const titleEl = document.getElementById('alerts-title');
    if (!token || !listEl) return;

    try {
        const response = await fetch('/api/vinculo/alertas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;
        const alertas = await response.json();

        if (titleEl) titleEl.style.display = alertas.length > 0 ? '' : 'none';
        listEl.innerHTML = '';

        const agora = Date.now();
        alertas.forEach(a => {
            let quandoMs = agora;
            if (a.timestamp) {
                const tsStr = a.timestamp.endsWith('Z') ? a.timestamp : a.timestamp + 'Z';
                const parsed = new Date(tsStr).getTime();
                if (!isNaN(parsed)) quandoMs = parsed;
            }
            const minutosAtras = Math.max(0, Math.round((agora - quandoMs) / 60000));
            const recente = minutosAtras <= 5;

            const card = document.createElement('div');
            card.className = 'alert-card' + (recente ? ' alert-recente' : '');
            card.innerHTML = `
                <p class="alert-titulo">🚨 ${a.paciente_nome} disparou um alerta de emergência</p>
                <p class="alert-tempo">${minutosAtras <= 0 ? 'agora mesmo' : `há ${minutosAtras} min`}</p>
            `;
            listEl.appendChild(card);
        });
    } catch (err) {
        console.error('Erro ao carregar alertas dos pacientes vinculados:', err);
    }
}
