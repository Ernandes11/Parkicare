async function salvarMedicamento() {
    const nome = document.querySelector("#nome").value;
    const dosagem = document.querySelector("#dosagem").value;

    const token = localStorage.getItem("token");

    const res = await fetch("/api/medicamentos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ nome, dosagem })
    });

    const data = await res.json();
    alert(data.msg);
}