
let emergencyTimer = null;
let secondsRemaining = 10;

function abrirEmergencia() {
    const modal = document.getElementById('emergency-modal');
    if (modal) {
        modal.classList.remove('hidden');
        iniciarContagem();
    }
}

function iniciarContagem() {
    const btnCancel = document.getElementById('btn-cancel-emergency');
    secondsRemaining = 10;
    
    // Check custom timer from settings
    const savedTimer = localStorage.getItem('parkicare_emergencyTimer');
    if (savedTimer) {
        secondsRemaining = parseInt(JSON.parse(savedTimer));
    }

    if (btnCancel) btnCancel.innerText = `(${secondsRemaining}s) Cancelar`;

    if (emergencyTimer) clearInterval(emergencyTimer);
    
    emergencyTimer = setInterval(() => {
        secondsRemaining--;
        if (btnCancel) btnCancel.innerText = `(${secondsRemaining}s) Cancelar`;
        
        if (secondsRemaining <= 0) {
            clearInterval(emergencyTimer);
            dispararAlerta();
        }
    }, 1000);
}

function cancelarEmergencia() {
    if (emergencyTimer) clearInterval(emergencyTimer);
    const modal = document.getElementById('emergency-modal');
    if (modal) modal.classList.add('hidden');
}

async function dispararAlerta() {
    console.log("ALERTA DISPARADO!");
    
    // 1. Notify Flask API
    const token = localStorage.getItem('parkicare_token');
    if (token) {
        try {
            await fetch('/api/emergencia', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    tipo: 'emergencia',
                    descricao: 'Botão de emergência pressionado pelo usuário no app.' 
                })
            });
        } catch (e) {
            console.error("Erro ao registrar alerta no servidor:", e);
        }
    }

    // 2. Open WhatsApp
    // The contacts should be in currentUser (loaded in telainicial.js)
    if (typeof currentUser !== 'undefined' && currentUser) {
        const message = "SOCORRO! Preciso de ajuda urgente!";
        const encodedMsg = encodeURIComponent(message);
        
        const contatos = [];
        if (currentUser.whatsapp) contatos.push(currentUser.whatsapp);
        if (currentUser.whatsapp2) contatos.push(currentUser.whatsapp2);

        if (contatos.length > 0) {
            // Open first one or group? For now, first one to avoid blocking
            window.open(`https://wa.me/${contatos[0]}?text=${encodedMsg}`, '_blank');
        } else {
            alert("Nenhum contato de emergência cadastrado!");
        }
    } else {
        alert("Erro ao carregar dados do usuário. Verifique sua conexão.");
    }
    
    cancelarEmergencia();
}
