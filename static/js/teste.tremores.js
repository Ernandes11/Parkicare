const canvas = document.getElementById("desenho");
const ctx = canvas.getContext("2d");

let desenhando = false;

ctx.lineWidth = 3;
ctx.lineCap = "round";
ctx.strokeStyle = "#5B2C2C";

// imagem de fundo do espiral
const espiral = new Image();
espiral.src = "/static/img/espiral.png";

espiral.onload = () => {
    ctx.globalAlpha = 0.25;
    ctx.drawImage(espiral, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
};

// Converte a posição do ponteiro (mouse ou dedo) em coordenadas do canvas.
// Como agora o canvas é responsivo (tamanho exibido pode ser diferente da
// resolução interna 325x325), é preciso escalar pela proporção real.
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
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function desenharAte(x, y) {
    if (!desenhando) return;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function pararDesenho() {
    desenhando = false;
    ctx.beginPath();
}

// parte do desenho - eventos de mouse (desktop)
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

// parte do desenho - eventos de toque (smartphone/tablet)
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault(); // evita rolar/dar zoom na página ao tocar no canvas
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

canvas.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    pararDesenho();
}, { passive: false });

// botao de refazer
document.querySelector(".refazer").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    ctx.globalAlpha = 0.25;
    ctx.drawImage(espiral, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
});

// botao do PDF
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
