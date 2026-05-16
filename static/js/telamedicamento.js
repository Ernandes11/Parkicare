// telamedicamento.js - 3 States Logic

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('parkicare_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    await fetchMedicamentos();
});

// UI Elements
const emptyStateView = document.getElementById('empty-state-view');
const listView = document.getElementById('list-view');
const formView = document.getElementById('form-view');

const pageHeader = document.getElementById('page-header');

const btnNewMeds = document.querySelectorAll('.btn-new-med');
const btnCancelForm = document.getElementById('btn-cancel-form');
const btnExports = document.querySelectorAll('.btn-export');

const listTitle = document.getElementById('list-title');
const listContainer = document.getElementById('med-list-container');
const template = document.getElementById('med-card-template');

let medicamentos = [];

// Navigation Logic
btnNewMeds.forEach(btn => {
    btn.addEventListener('click', () => {
        emptyStateView.style.display = 'none';
        listView.style.display = 'none';
        formView.style.display = 'block';
        pageHeader.style.display = 'none'; // Hide header when form is open to focus on form
    });
});

btnCancelForm.addEventListener('click', () => {
    formView.style.display = 'none';
    pageHeader.style.display = 'block';
    renderUI(); // Go back to correct state (empty or list)
});

async function fetchMedicamentos() {
    const token = localStorage.getItem('parkicare_token');
    try {
        const response = await fetch('/api/medicamentos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erro ao buscar dados');
        
        medicamentos = await response.json();
        
        // Hide form and show header on load
        formView.style.display = 'none';
        pageHeader.style.display = 'block';
        
        renderUI();
    } catch (e) {
        console.error(e);
    }
}

function renderUI() {
    if (medicamentos.length === 0) {
        emptyStateView.style.display = 'block';
        listView.style.display = 'none';
    } else {
        emptyStateView.style.display = 'none';
        listView.style.display = 'block';
        
        listTitle.textContent = `Medicamentos Cadastrados (${medicamentos.length})`;
        listContainer.innerHTML = '';
        
        medicamentos.forEach(med => {
            const clone = template.content.cloneNode(true);
            clone.querySelector('.med-name').textContent = med.nome;
            clone.querySelector('.med-dosagem').textContent = med.dosagem;
            clone.querySelector('.med-horario').textContent = med.horario || '--:--';
            
            const btnDelete = clone.querySelector('.btn-delete');
            btnDelete.addEventListener('click', () => deletarMedicamento(med.id));
            
            listContainer.appendChild(clone);
        });
    }
}

// Handle Form Submit
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
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Salvando...';
        submitBtn.disabled = true;

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

            form.reset();
            await fetchMedicamentos(); // Will automatically return to the list view
            
        } catch (e) {
            console.error('Error saving:', e);
            alert('Erro ao salvar medicamento: ' + e.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Handle Delete
async function deletarMedicamento(id) {
    if (!confirm('Tem certeza que deseja excluir este medicamento?')) return;
    
    const token = localStorage.getItem('parkicare_token');
    try {
        const response = await fetch(`/api/medicamentos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Erro ao deletar');
        
        await fetchMedicamentos();
    } catch (e) {
        console.error(e);
        alert('Erro ao deletar: ' + e.message);
    }
}

// Export Functionality
btnExports.forEach(btn => {
    btn.addEventListener('click', exportarRelatorio);
});

async function exportarRelatorio() {
    if (medicamentos.length === 0) {
        alert('Não há medicamentos para exportar.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Medicamento,Dosagem,Horario\n";

    medicamentos.forEach(row => {
        csvContent += `${row.nome},${row.dosagem},${row.horario || ''}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_medicamentos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
