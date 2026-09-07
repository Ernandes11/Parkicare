// telacadastro.js
const form = document.getElementById('registerForm');
const toggleSenha = document.getElementById('toggleSenha');
const toggleConfirmarSenha = document.getElementById('toggleConfirmarSenha');
const senha = document.getElementById('senha');
const confirmarSenhaInput = document.getElementById('confirmar_senha');

function setupToggle(toggle, input) {
  if (toggle && input) {
    toggle.addEventListener('click', () => {
      const tipo = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', tipo);
      toggle.classList.toggle('active');
    });
  }
}

setupToggle(toggleSenha, senha);
setupToggle(toggleConfirmarSenha, confirmarSenhaInput);

// Handle second contact addition
const btnAddContact = document.getElementById('btn-add-contact');
const contactsContainer = document.getElementById('contacts-container');
let contactCount = 1;

if (btnAddContact && contactsContainer) {
    btnAddContact.addEventListener('click', () => {
        if (contactCount >= 2) {
            alert('Você já adicionou o limite máximo de contatos (2).');
            return;
        }

        const secondCard = document.createElement('div');
        secondCard.className = 'contact-card';
        secondCard.innerHTML = `
            <div class="input-group">
                <label for="nome_contato2">Nome do Contato 2</label>
                <input type="text" id="nome_contato2" name="nome_contato2" placeholder="Nome da 2ª pessoa de contato" autocomplete="off">
                <p class="error-text" id="nome-contato2-error"></p>
            </div>

            <div class="input-group">
                <label for="whatsapp2">Telefone do Contato 2</label>
                <input type="tel" id="whatsapp2" name="whatsapp2" placeholder="(00) 00000-0000" autocomplete="tel">
                <p class="error-text" id="whatsapp2-error"></p>
            </div>
        `;
        contactsContainer.appendChild(secondCard);
        contactCount++;
        
        // Hide button since we only support 2 contacts in the DB right now
        btnAddContact.style.display = 'none';
    });
}

// Mostrar/Ocultar contatos de emergência baseado no Tipo de Usuário (Paciente x Cuidador)
const radiosTipo = document.querySelectorAll('input[name="tipo"]');
const sectionContatosHeader = document.querySelector('.contacts-header');
const sectionContatosContainer = document.getElementById('contacts-container');

function atualizarVisibilidadeContatos() {
    const tipoSelecionado = document.querySelector('input[name="tipo"]:checked')?.value;
    if (tipoSelecionado === 'cuidador') {
        if (sectionContatosHeader) sectionContatosHeader.style.display = 'none';
        if (sectionContatosContainer) sectionContatosContainer.style.display = 'none';
    } else {
        if (sectionContatosHeader) sectionContatosHeader.style.display = '';
        if (sectionContatosContainer) sectionContatosContainer.style.display = '';
    }
}

radiosTipo.forEach(radio => {
    radio.addEventListener('change', atualizarVisibilidadeContatos);
});

// Executa na inicialização
atualizarVisibilidadeContatos();

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear errors
    document.querySelectorAll('.error-text').forEach(el => el.textContent = '');

    // Get values
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senhaValor = senha.value.trim();
    const confirmarSenha = document.getElementById('confirmar_senha').value.trim();
    const tipo = document.querySelector('input[name="tipo"]:checked')?.value || 'paciente';
    
    // Contatos (opcional se for cuidador)
    const nomeContato = document.getElementById('nome_contato')?.value.trim() || '';
    const whatsapp = document.getElementById('whatsapp')?.value.trim() || '';
    const whatsapp2Elem = document.getElementById('whatsapp2');
    const whatsapp2 = whatsapp2Elem ? whatsapp2Elem.value.trim() : '';
    const nomeContato2Elem = document.getElementById('nome_contato2');
    const nomeContato2 = nomeContato2Elem ? nomeContato2Elem.value.trim() : '';

    let hasError = false;
    const showError = (fieldId, message) => {
      const el = document.getElementById(`${fieldId}-error`);
      if (el) el.textContent = message;
      hasError = true;
    };

    // Validation
    if (!nome) showError('nome', 'Preencha o nome.');
    if (!email || !/\S+@\S+\.\S+/.test(email)) showError('email', 'Email inválido.');
    if (!senhaValor || senhaValor.length < 8) {
      showError('senha', 'A senha deve ter no mínimo 8 caracteres.');
    } else if (!/[a-zA-Z]/.test(senhaValor)) {
      showError('senha', 'A senha deve conter pelo menos uma letra.');
    } else if (!/[0-9]/.test(senhaValor)) {
      showError('senha', 'A senha deve conter pelo menos um número.');
    }
    if (senhaValor !== confirmarSenha) showError('confirmar-senha', 'As senhas não coincidem.');
    
    if (tipo === 'paciente') {
        if (!nomeContato) showError('nome-contato', 'Preencha o nome do contato de emergência.');
        if (!whatsapp || !/^[0-9]{10,11}$/.test(whatsapp)) showError('whatsapp', 'Número inválido (apenas números, DDD+Numero).');
        if (whatsapp2 && !/^[0-9]{10,11}$/.test(whatsapp2)) showError('whatsapp2', 'Número inválido (apenas números, DDD+Numero).');
    }

    if (hasError) return;

    // Flask Cadastro
    try {
      const btn = form.querySelector('button.btn-primary');
      if (btn) {
        btn.disabled = true;
        btn.innerText = 'Criando conta...';
      }

      const payload = {
        nome,
        email,
        senha: senhaValor,
        tipo
      };

      if (tipo === 'paciente') {
        payload.nome_contato = nomeContato;
        payload.whatsapp = whatsapp;
        payload.whatsapp2 = whatsapp2;
        payload.nome_contato2 = nomeContato2;
      } else {
        payload.nome_contato = "Cuidador"; 
      }

      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.erro || 'Falha ao criar conta');
      }

      alert('Conta criada com sucesso! Você já pode fazer login.');
      window.location.href = '/login';

    } catch (err) {
      console.error("Erro cadastro:", err);
      const msg = err.message || 'Tente novamente.';
      if (msg.toLowerCase().includes('senha')) {
        showError('senha', msg);
      } else {
        showError('email', msg);
      }
    } finally {
      const btn = form.querySelector('button.btn-primary');
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Cadastrar';
      }
    }
  });
}
