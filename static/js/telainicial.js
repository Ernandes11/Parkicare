async function carregarMedicamentos() {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/medicamentos", {
        headers: {"Authorization": "Bearer " + token}
    });

    const dados = await res.json();
    console.log(dados);
}

window.onload = carregarMedicamentos;