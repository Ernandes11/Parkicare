async function cadastrar(event) {
    event.preventDefault(); // Previne o envio padrão do formulário
    
    const email = document.querySelector("#email").value.trim();
    const senha = document.querySelector("#senha").value;
    const confirmar_senha = document.querySelector("#confirmar_senha").value;
    const nome = document.querySelector("#nome").value.trim();
    const whatsapp = document.querySelector("#whatsapp").value.trim();
    const whatsapp2 = document.querySelector("#whatsapp2").value.trim();

    // Validar campos vazios
    if (!email || !senha || !confirmar_senha || !nome || !whatsapp) {
        alert("Por favor, preencha todos os campos obrigatórios!");
        return;
    }

    // Validar se as senhas conferem
    if (senha !== confirmar_senha) {
        alert("As senhas não conferem!");
        return;
    }

    // Validar comprimento da senha
    if (senha.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres!");
        return;
    }

    try {
        const res = await fetch("/api/cadastro", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ 
                email, 
                senha,
                nome,
                whatsapp,
                whatsapp2
            })
        });

        const data = await res.json();
        
        if (res.ok) {
            alert("Cadastro realizado com sucesso! Faça login agora.");
            window.location.href = "/login";
        } else {
            alert("Erro no cadastro: " + (data.erro || data.msg));
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao conectar com o servidor. Tente novamente.");
    }
}

// Adicionar listener ao formulário
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', cadastrar);
    }
});