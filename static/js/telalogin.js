async function login(event) {
    if (event) {
        event.preventDefault();
    }
    
    const email = document.querySelector("#email").value.trim();
    const senha = document.querySelector("#senha").value;

    if (!email || !senha) {
        alert("Por favor, preencha email e senha!");
        return;
    }

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email, senha })
        });

        const data = await res.json();

        if (data.token) {
            localStorage.setItem("token", data.token);
            window.location.href = "/inicial";
        } else {
            alert("Erro no login: " + (data.erro || "Email ou senha incorretos"));
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao conectar com o servidor. Tente novamente.");
    }
}

// Adicionar listener ao formulário
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', login);
    }
});