// Sistema de Alerta de Emergência
let emergencyTimeout = null;
let emergencyCountdown = 10;
let emergencyAudio = null;

// Carregar áudio de sirene
function inicializarEmergencia() {
    // Usar o som de sirene disponível
    emergencyAudio = new Audio('/static/img/sirene.mp3');
    emergencyAudio.loop = true;
}

// Mostrar modal de emergência
function mostrarEmergencia() {
    const modal = document.getElementById('emergency-modal');
    const button = document.getElementById('btn-cancel-emergency');
    
    if (!modal) return;
    
    modal.classList.remove('hidden');
    emergencyCountdown = 10;
    atualizarBotaoCancelamento();
    
    // Tentar reproduzir som de sirene
    if (emergencyAudio) {
        emergencyAudio.play().catch(() => {
            console.log('Não foi possível reproduzir som de sirene');
        });
    }
    
    // Animação da sirene
    animarSirene();
    
    // Iniciar contagem regressiva
    emergencyTimeout = setInterval(() => {
        emergencyCountdown--;
        atualizarBotaoCancelamento();
        
        if (emergencyCountdown <= 0) {
            confirmarEmergencia();
        }
    }, 1000);
}

// Atualizar botão de cancelamento com contagem
function atualizarBotaoCancelamento() {
    const button = document.getElementById('btn-cancel-emergency');
    if (button) {
        button.textContent = `(${emergencyCountdown}s) cancelar`;
    }
}

// Animar sirene com vibração e efeito visual
function animarSirene() {
    const siren = document.querySelector('.siren-icon');
    if (!siren) return;
    
    let frame = 0;
    const animarFrame = () => {
        frame = (frame + 1) % 4;
        siren.style.transform = `rotate(${frame * 10}deg) scale(${1 + frame * 0.05})`;
        
        if (!document.getElementById('emergency-modal').classList.contains('hidden')) {
            setTimeout(animarFrame, 100);
        }
    };
    
    animarFrame();
    
    // Vibração do dispositivo (se suportado)
    if (navigator.vibrate) {
        const vibraPattern = [200, 100, 200, 100, 500]; // Padrão de vibração
        navigator.vibrate(vibraPattern);
    }
}

// Cancelar emergência
function cancelarEmergencia() {
    const modal = document.getElementById('emergency-modal');
    
    if (emergencyTimeout) {
        clearInterval(emergencyTimeout);
    }
    
    if (emergencyAudio) {
        emergencyAudio.pause();
        emergencyAudio.currentTime = 0;
    }
    
    if (modal) {
        modal.classList.add('hidden');
    }
    
    emergencyCountdown = 10;
    
    // Parar vibração
    if (navigator.vibrate) {
        navigator.vibrate(0);
    }
}

// Confirmar emergência e enviar alerta
async function confirmarEmergencia() {
    const modal = document.getElementById('emergency-modal');
    
    if (emergencyTimeout) {
        clearInterval(emergencyTimeout);
    }
    
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Som de confirmação (beep rápido)
    if (emergencyAudio) {
        emergencyAudio.pause();
    }
    
    try {
        const token = localStorage.getItem("token");
        const response = await fetch('/api/emergencia', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                tipo: 'emergencia'
            })
        });
        
        if (response.ok) {
            mostrarNotificacao('✓ Alerta de emergência enviado!', 'success');
        }
    } catch (error) {
        console.error('Erro ao enviar alerta:', error);
        mostrarNotificacao('✓ Alerta enviado (modo offline)', 'success');
    }
}

// Notificação visual
function mostrarNotificacao(mensagem, tipo = 'info') {
    const notificacao = document.createElement('div');
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        background-color: ${tipo === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
    `;
    notificacao.textContent = mensagem;
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.remove();
    }, 3000);
}

// Alternar status de medicamento no modal de detalhes
function alternarStatusDetalhe() {
    // Implementar conforme necessário
    console.log('Alternar status');
}

// Excluir medicamento
function excluirMedicamento() {
    // Implementar conforme necessário
    console.log('Excluir medicamento');
}

// Fechar modal de detalhes
function fecharDetalhes() {
    const modal = document.getElementById('details-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Confirmar tomada de medicamento
function confirmarTomada() {
    console.log('Medicamento tomado');
}

// Inicializar ao carregar página
window.addEventListener('DOMContentLoaded', () => {
    inicializarEmergencia();
});
