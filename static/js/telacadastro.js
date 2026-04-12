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
    const nomeContato = document.getElementById('nome_contato').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const whatsapp2Elem = document.getElementById('whatsapp2');
    const whatsapp2 = whatsapp2Elem ? whatsapp2Elem.value.trim() : '';

    let hasError = false;
    const showError = (fieldId, message) => {
      const el = document.getElementById(`${fieldId}-error`);
      if (el) el.textContent = message;
      hasError = true;
    };

    // Validation
    if (!nome) showError('nome', 'Preencha o nome.');
    if (!email || !/\S+@\S+\.\S+/.test(email)) showError('email', 'Email inválido.');
    if (!senhaValor || senhaValor.length < 6) showError('senha', 'Senha deve ter no mínimo 6 caracteres.');
    if (senhaValor !== confirmarSenha) showError('confirmar-senha', 'As senhas não coincidem.');
    if (!nomeContato) showError('nome-contato', 'Preencha o nome do contato de emergência.');
    if (!whatsapp || !/^[0-9]{10,11}$/.test(whatsapp)) showError('whatsapp', 'Número inválido (apenas números, DDD+Numero).');
    if (whatsapp2 && !/^[0-9]{10,11}$/.test(whatsapp2)) showError('whatsapp2', 'Número inválido (apenas números, DDD+Numero).');

    if (hasError) return;

    // Flask Cadastro
    try {
      const btn = form.querySelector('button.btn-primary');
      btn.disabled = true;
      btn.innerText = 'Criando conta...';

      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          senha: senhaValor,
          nome_contato: nomeContato,
          whatsapp,
          whatsapp2,
          nome_contato2: ''
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.erro || 'Falha ao criar conta');
      }

      alert('Conta criada com sucesso! Você já pode fazer login.');
      window.location.href = '/login';

    } catch (err) {
      console.error("Erro cadastro:", err);
      showError('email', err.message || 'Tente novamente.');
    } finally {
      const btn = form.querySelector('button.btn-primary');
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Criar Conta';
      }
    }
  });
}
