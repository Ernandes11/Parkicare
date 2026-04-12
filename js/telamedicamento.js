
// telamedicamento.js with Supabase Integration

// Check Auth first
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'telalogin.html';
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

        const { data: { user } } = await window.supabaseClient.auth.getUser();

        if (!user) {
            alert('Erro de autenticação. Faça login novamente.');
            window.location.href = 'telalogin.html';
            return;
        }

        // Insert into Supabase
        const { error } = await window.supabaseClient
            .from('medicamentos')
            .insert({
                user_id: user.id,
                nome: nome,
                horario: horario,
                intervalo: 0,
                dosagem: dosagem,
                unidade: 'mg',
                tomado: false
            });

        if (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar medicamento: ' + error.message);
            return;
        }

        alert('Medicamento cadastrado com sucesso!');
        window.location.href = 'telainicial.html';
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
    const { data: historico, error } = await window.supabaseClient
        .from('historico')
        .select('*')
        .order('data_evento', { ascending: false });

    if (error) {
        alert('Erro ao baixar histórico.');
        return;
    }

    if (!historico || historico.length === 0) {
        alert('Não há histórico para exportar.');
        return;
    }

    // CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data/Hora,Medicamento,Status\n";

    // CSV Rows
    historico.forEach(function (row) {
        // Format date simply
        const dateObj = new Date(row.data_evento);
        const dateStr = dateObj.toLocaleString('pt-BR');
        csvContent += `${dateStr},${row.med_nome},${row.status}\n`;
    });

    // Encode and Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_medicamentos.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
}
