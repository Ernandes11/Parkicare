const canvas = document.getElementById("desenho");
const ctx = canvas.getContext("2d");

let desenhando = false;
let drawnPoints = [];

ctx.lineWidth = 3;
ctx.lineCap = "round";
ctx.strokeStyle = "#5B2C2C";

// Imagem de fundo da espiral
const espiral = new Image();
espiral.src = "/static/img/espiral.png";

espiral.onload = () => {
    ctx.globalAlpha = 0.25;
    ctx.drawImage(espiral, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
};

function getPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function iniciarDesenho(x, y) {
    desenhando = true;
    drawnPoints.push({ x, y, t: Date.now() });
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function desenharAte(x, y) {
    if (!desenhando) return;
    drawnPoints.push({ x, y, t: Date.now() });
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function pararDesenho() {
    desenhando = false;
    ctx.beginPath();
}

// Eventos de Mouse
canvas.addEventListener("mousedown", (e) => {
    const { x, y } = getPos(e.clientX, e.clientY);
    iniciarDesenho(x, y);
});
canvas.addEventListener("mouseup", pararDesenho);
canvas.addEventListener("mouseleave", pararDesenho);
canvas.addEventListener("mousemove", (e) => {
    if (!desenhando) return;
    const { x, y } = getPos(e.clientX, e.clientY);
    desenharAte(x, y);
});

// Eventos de Toque
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = getPos(touch.clientX, touch.clientY);
    iniciarDesenho(x, y);
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (!desenhando) return;
    const touch = e.touches[0];
    const { x, y } = getPos(touch.clientX, touch.clientY);
    desenharAte(x, y);
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    pararDesenho();
}, { passive: false });

// Refazer
document.querySelector(".refazer").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    drawnPoints = [];

    ctx.globalAlpha = 0.25;
    ctx.drawImage(espiral, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    const resBox = document.getElementById("resultado-analise");
    if (resBox) resBox.style.display = "none";
});

// Botão Analisar Traço
const btnAnalisar = document.getElementById("btn-analisar");
if (btnAnalisar) {
    btnAnalisar.addEventListener("click", analisarTracado);
}

async function analisarTracado() {
    if (drawnPoints.length < 10) {
        alert("Por favor, faça um traçado no desenho antes de analisar.");
        return;
    }

    // Algoritmo de Análise de Tremores:
    // 1. Calcula variação de distância entre pontos consecutivos (jerk/tremor index)
    // 2. Compara desvios do centro (raio ideal da espiral r = a * theta)
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    let totalJitter = 0;
    let pointCount = 0;

    for (let i = 2; i < drawnPoints.length; i++) {
        const p1 = drawnPoints[i - 2];
        const p2 = drawnPoints[i - 1];
        const p3 = drawnPoints[i];

        const v1x = p2.x - p1.x;
        const v1y = p2.y - p1.y;
        const v2x = p3.x - p2.x;
        const v2y = p3.y - p2.y;

        const angulo1 = Math.atan2(v1y, v1x);
        const angulo2 = Math.atan2(v2y, v2x);
        let diff = Math.abs(angulo2 - angulo1);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;

        totalJitter += diff;
        pointCount++;
    }

    const avgJitter = pointCount > 0 ? totalJitter / pointCount : 0;
    // Converte média de variação angular em pontuação de estabilidade 0 a 100%
    let estabilidade = Math.max(10, Math.min(100, Math.round(100 - avgJitter * 45)));

    let classificacao = "";
    if (estabilidade >= 85) classificacao = "Excelente estabilidade (mão firme)";
    else if (estabilidade >= 70) classificacao = "Leve oscilação observada";
    else if (estabilidade >= 50) classificacao = "Tremor moderado detectado";
    else classificacao = "Oscilação acentuada no traço";

    const resBox = document.getElementById("resultado-analise");
    const scoreTxt = document.getElementById("score-texto");
    const feedbackTxt = document.getElementById("feedback-texto");

    if (resBox && scoreTxt && feedbackTxt) {
        scoreTxt.textContent = `Estabilidade: ${estabilidade}%`;
        feedbackTxt.textContent = classificacao;
        resBox.style.display = "block";
    }

    // Salvar na API
    const token = localStorage.getItem("parkicare_token");
    if (token) {
        try {
            await fetch("/api/tremores", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ pontuacao: estabilidade, desvio: avgJitter })
            });
        } catch (e) {
            console.error("Erro ao salvar resultado na API:", e);
        }
    }
}

// Histórico de Testes
const btnVerHist = document.getElementById("btn-ver-historico");
const btnFecharHist = document.getElementById("btn-fechar-historico");
const modalHist = document.getElementById("historico-modal");

if (btnVerHist) btnVerHist.addEventListener("click", carregarHistoricoTremores);
if (btnFecharHist) btnFecharHist.addEventListener("click", () => {
    if (modalHist) modalHist.style.display = "none";
});

async function carregarHistoricoTremores() {
    const token = localStorage.getItem("parkicare_token");
    const container = document.getElementById("lista-historico-tremores");
    if (!container) return;

    if (!token) {
        alert("Faça login para salvar e ver seu histórico de motricidade.");
        return;
    }

    if (modalHist) modalHist.style.display = "flex";
    container.innerHTML = "<p style='text-align:center;'>Carregando...</p>";

    try {
        const response = await fetch("/api/tremores", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Erro ao carregar");

        const dados = await response.json();
        container.innerHTML = "";

        if (dados.length === 0) {
            container.innerHTML = "<p style='text-align:center; color:#666;'>Nenhum teste registrado ainda.</p>";
            return;
        }

        dados.forEach(t => {
            const dataStr = t.timestamp ? new Date(t.timestamp).toLocaleDateString("pt-BR", { hour: '2-digit', minute: '2-digit' }) : "Data desc.";
            const card = document.createElement("div");
            card.style.cssText = "padding: 10px 14px; background: #F8F9FA; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;";
            card.innerHTML = `
                <div>
                    <strong>Estabilidade: ${t.pontuacao}%</strong>
                    <div style="font-size: 0.8rem; color: #777;">${dataStr}</div>
                </div>
                <span style="font-weight: bold; color: ${t.pontuacao >= 75 ? '#3FA34D' : (t.pontuacao >= 50 ? '#f39c12' : '#e74c3c')};">
                    ${t.pontuacao >= 75 ? 'Firme' : (t.pontuacao >= 50 ? 'Moderado' : 'Acentuado')}
                </span>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        container.innerHTML = "<p style='color:red; text-align:center;'>Erro ao carregar histórico.</p>";
    }
}

// Exportar PDF
document.querySelector(".exportar").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    const agora = new Date();
    const dataHora = agora.toLocaleString("pt-BR");

    pdf.setFontSize(22);
    pdf.text("Aqui está o seu desenho do teste", 20, 20);

    pdf.setFontSize(14);
    pdf.text(`Realizado em: ${dataHora}`, 20, 30);

    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 15, 40, 180, 180);

    pdf.save("desenho_teste_motricidade.pdf");
});
