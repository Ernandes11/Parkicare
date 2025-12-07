// telacadastro.js
const form = document.getElementById('registerForm');
const toggleSenha = document.getElementById('toggleSenha');
const senha = document.getElementById('senha');

if (toggleSenha && senha) {
  toggleSenha.addEventListener('click', () => {
    const tipo = senha.getAttribute('type') === 'password' ? 'text' : 'password';
    senha.setAttribute('type', tipo);
    toggleSenha.classList.toggle('active');
  });
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear errors
    document.querySelectorAll('.error-text').forEach(el => el.textContent = '');

    // Get values
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senhaValor = senha.value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();

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
    if (!whatsapp || !/^[0-9]{10,11}$/.test(whatsapp)) showError('whatsapp', 'Número inválido (apenas números, DDD+Numero).');

    if (hasError) return;

    // Supabase Sign Up
    try {
      const btn = form.querySelector('button');
      const originalText = btn.innerText;
      btn.disabled = true;
      btn.innerText = 'Criando conta...';

      const { data, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: senhaValor,
        options: {
          data: {
            full_name: nome,
            whatsapp: whatsapp
          }
        }
      });

      if (error) {
        throw error;
      }

      alert('Conta criada com sucesso! Você será redirecionado.');
      window.location.href = 'telainicial.html';

    } catch (err) {
      console.error("Erro cadastro:", err);
      showError('email', 'Erro ao criar conta: ' + (err.message || 'Tente novamente.'));
    } finally {
      const btn = form.querySelector('button');
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Vamos começar!';
      }
    }
  });
}
