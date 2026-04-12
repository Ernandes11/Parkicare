
// telamedicamento.js - Flask Integration

// Check Auth first
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('parkicare_token');
    if (!token) {
        window.location.href = '/login';
    }
});

const form = document.getElementById('medicamento-form');
if (form) {
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const nome = document.getElementById('nome').value;
        const horario = document.getElementById('horario').value;
        const dosagem = document.getElementById('dosagem').value;

        if (!nome || !horario || !dosagem) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const token = localStorage.getItem('parkicare_token');
        if (!token) {
            alert('Erro de autenticação. Faça login novamente.');
            window.location.href = '/login';
            return;
        }

        // Insert into Flask
        try {
            const response = await fetch('/api/medicamentos', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome: nome,
                    horario: horario,
                    dosagem: dosagem,
                    intervalo: 0,
                    unidade: 'mg'
                })
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.erro || 'Erro ao salvar');
            }

            alert('Medicamento cadastrado com sucesso!');
            window.location.href = '/inicial';
        } catch (e) {
            console.error('Error saving:', e);
            alert('Erro ao salvar medicamento: ' + e.message);
        }
    });
}

// Export Functionality
const exportBtn = document.querySelector('.export-button');
if (exportBtn) {
    exportBtn.addEventListener('click', function () {
        exportarRelatorio();
    });
}

async function exportarRelatorio() {
    const token = localStorage.getItem('parkicare_token');
    const response = await fetch('/api/relatorio', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const meds = await response.json();

    if (!meds || meds.length === 0) {
        alert('Não há medicamentos para exportar.');
        return;
    }

    // CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Medicamento,Dosagem,Horário,Intervalo (h),Unidade,Status\n";

    // CSV Rows
    meds.forEach(function (row) {
        csvContent += `${row.nome},${row.dosagem},${row.horario},${row.intervalo},${row.unidade},${row.status}\n`;
    });

    // Encode and Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_medicamentos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
