// telalogin.js
const form = document.getElementById('loginForm');
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

        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');

        const email = document.getElementById('email').value.trim();
        const senhaValor = senha.value.trim();

        let hasError = false;
        const showError = (fieldId, message) => {
            const el = document.getElementById(`${fieldId}-error`);
            if (el) el.textContent = message;
            hasError = true;
        };

        if (!email) showError('email', 'Preencha o email.');
        if (!senhaValor) showError('senha', 'Preencha a senha.');

        if (hasError) return;

        try {
            const btn = form.querySelector('button');
            btn.disabled = true;
            btn.innerText = 'Entrando...';

            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: senhaValor
            });

            if (error) throw error;

            // Redirect
            window.location.href = 'telainicial.html';

        } catch (err) {
            console.error("Erro login:", err);
            showError('senha', 'Erro ao entrar: Email ou senha incorretos.');
        } finally {
            const btn = form.querySelector('button');
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Entrar';
            }
        }
    });
}
