// Função para navegar entre páginas
function irPara(url) {
    window.location.href = url;
}

// Função para verificar se usuário está autenticado
function verificarAutenticacao() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        return false;
    }
    return true;
}

// Função para fazer logout
function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
}
