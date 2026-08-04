// telamedicamento.js - 3 States Logic

// Se veio de /medicamentos?paciente_id=X&nome=Y, é o cuidador gerenciando
// os remédios de um paciente vinculado.
const paramsUrl = new URLSearchParams(window.location.search);
const pacienteIdContexto = paramsUrl.get('paciente_id');
const pacienteNomeContexto = paramsUrl.get('nome');

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('parkicare_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Sem contexto de paciente na URL: essa é a tela de remédios do
    // próprio usuário. Se for um cuidador (que não tem remédios
    // próprios), manda ele para a tela dele em vez de quebrar aqui.
    if (!pacienteIdContexto) {
        try {
            const perfilResp = await fetch('/api/perfil', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (perfilResp.ok) {
                const perfil = await perfilResp.json();
                if (perfil.tipo === 'cuidador') {
                    window.location.href = '/cuidador';
                    return;
                }
            }
        } catch (e) {
            console.error('Falha ao verificar perfil:', e);
        }
    } else {
        // Cuidador gerenciando o paciente vinculado: ajusta cabeçalho e
        // o link de "voltar" para a tela do cuidador.
        const titleEl = document.getElementById('page-title');
        const subtitleEl = document.getElementById('page-subtitle');
        const linkVoltar = document.getElementById('link-voltar');
        if (titleEl) titleEl.textContent = pacienteNomeContexto ? `Remédios de ${pacienteNomeContexto}` : 'Remédios do paciente';
        if (subtitleEl) subtitleEl.textContent = 'Gerencie os medicamentos deste paciente';
        if (linkVoltar) linkVoltar.setAttribute('href', '/cuidador');
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
    resetarCampoFoto();
    renderUI(); // Go back to correct state (empty or list)
});

async function fetchMedicamentos() {
    const token = localStorage.getItem('parkicare_token');
    try {
        const url = pacienteIdContexto
            ? `/api/medicamentos?paciente_id=${encodeURIComponent(pacienteIdContexto)}`
            : '/api/medicamentos';
        const response = await fetch(url, {
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

            const fotoEl = clone.querySelector('.med-foto');
            const placeholderEl = clone.querySelector('.med-foto-placeholder');
            if (med.foto) {
                fotoEl.src = med.foto;
                fotoEl.style.display = 'block';
                placeholderEl.style.display = 'none';
            }

            const btnDelete = clone.querySelector('.btn-delete');
            btnDelete.addEventListener('click', () => deletarMedicamento(med.id));
            
            listContainer.appendChild(clone);
        });
    }
}

// Foto: preview + conversão para base64 (para enviar no JSON do form)
const inputFoto = document.getElementById('foto');
const fotoPreviewWrapper = document.getElementById('foto-preview-wrapper');
const fotoPreviewImg = document.getElementById('foto-preview');
const btnTirarFoto = document.getElementById('btn-tirar-foto');
const btnRemoverFoto = document.getElementById('btn-remover-foto');
let fotoBase64Atual = null;

if (inputFoto) {
    inputFoto.addEventListener('change', () => {
        const arquivo = inputFoto.files && inputFoto.files[0];
        if (!arquivo) return;

        if (arquivo.size > 4 * 1024 * 1024) {
            alert('A foto é muito grande. Escolha uma imagem de até 4MB.');
            inputFoto.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            fotoBase64Atual = reader.result; // já vem como "data:image/...;base64,...."
            fotoPreviewImg.src = fotoBase64Atual;
            fotoPreviewWrapper.style.display = 'inline-block';
            btnTirarFoto.style.display = 'none';
        };
        reader.readAsDataURL(arquivo);
    });
}

if (btnRemoverFoto) {
    btnRemoverFoto.addEventListener('click', () => {
        fotoBase64Atual = null;
        inputFoto.value = '';
        fotoPreviewWrapper.style.display = 'none';
        btnTirarFoto.style.display = 'flex';
    });
}

function resetarCampoFoto() {
    fotoBase64Atual = null;
    if (inputFoto) inputFoto.value = '';
    if (fotoPreviewWrapper) fotoPreviewWrapper.style.display = 'none';
    if (btnTirarFoto) btnTirarFoto.style.display = 'flex';
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
            const payload = {
                nome: nome,
                horario: horario,
                dosagem: dosagem,
                intervalo: 0,
                unidade: 'mg'
            };
            if (fotoBase64Atual) payload.foto = fotoBase64Atual;
            if (pacienteIdContexto) payload.paciente_id = Number(pacienteIdContexto);

            const response = await fetch('/api/medicamentos', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.erro || 'Erro ao salvar');
            }

            form.reset();
            resetarCampoFoto();
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
        const url = pacienteIdContexto
            ? `/api/medicamentos/${id}?paciente_id=${encodeURIComponent(pacienteIdContexto)}`
            : `/api/medicamentos/${id}`;
        const response = await fetch(url, {
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
