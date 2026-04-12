const canvas = document.getElementById("desenho");
const ctx = canvas.getContext("2d");

let desenhando = false;

ctx.lineWidth = 3;
ctx.lineCap = "round";
ctx.strokeStyle = "#5B2C2C";

// imagem de fundo do espiral
const espiral = new Image();
espiral.src = "assets/img/espiral.png";

espiral.onload = () => {
    ctx.globalAlpha = 0.25;
    ctx.drawImage(espiral, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
};

// parte do desenho
canvas.addEventListener("mousedown", () => desenhando = true);
canvas.addEventListener("mouseup", () => {
    desenhando = false;
    ctx.beginPath();
});

canvas.addEventListener("mousemove", (e) => {
    if (!desenhando) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
});

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
    pdf.text(`Data e hora: ${dataHora}`, 20, 30);

    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 15, 40, 180, 180);

    pdf.save("desenho_teste_motricidade.pdf");
});