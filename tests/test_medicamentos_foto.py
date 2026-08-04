import base64
from conftest import cadastrar, login, auth_header

# Um PNG 1x1 pixel válido, só para os testes de upload de foto.
PNG_1X1_BASE64 = base64.b64encode(bytes([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
])).decode('ascii')
FOTO_VALIDA = f"data:image/png;base64,{PNG_1X1_BASE64}"


def _paciente_e_cuidador_vinculados(client, sufixo=''):
    cadastrar(client, f'p_med{sufixo}@teste.com', tipo='paciente')
    cadastrar(client, f'c_med{sufixo}@teste.com', tipo='cuidador')
    token_paciente = login(client, f'p_med{sufixo}@teste.com').get_json()['token']
    token_cuidador = login(client, f'c_med{sufixo}@teste.com').get_json()['token']
    perfil = client.get('/api/perfil', headers=auth_header(token_paciente)).get_json()
    client.post('/api/vinculo', json={"codigo": perfil['codigo_vinculo']}, headers=auth_header(token_cuidador))
    return token_paciente, token_cuidador, perfil['id']


def test_paciente_cadastra_medicamento_com_foto(client):
    cadastrar(client, 'pfoto@teste.com', tipo='paciente')
    token = login(client, 'pfoto@teste.com').get_json()['token']

    resp = client.post('/api/medicamentos', json={
        "nome": "Levodopa", "dosagem": "100mg", "horario": "08:00", "foto": FOTO_VALIDA
    }, headers=auth_header(token))

    assert resp.status_code == 201
    assert resp.get_json()['foto'].startswith('/static/uploads/medicamentos/')

    medicamentos = client.get('/api/medicamentos', headers=auth_header(token)).get_json()
    assert medicamentos[0]['foto'] is not None


def test_medicamento_sem_foto_retorna_foto_nula(client):
    cadastrar(client, 'psemfoto@teste.com', tipo='paciente')
    token = login(client, 'psemfoto@teste.com').get_json()['token']

    client.post('/api/medicamentos', json={
        "nome": "Levodopa", "dosagem": "100mg", "horario": "08:00"
    }, headers=auth_header(token))

    medicamentos = client.get('/api/medicamentos', headers=auth_header(token)).get_json()
    assert medicamentos[0]['foto'] is None


def test_foto_invalida_e_rejeitada(client):
    cadastrar(client, 'pfotoruim@teste.com', tipo='paciente')
    token = login(client, 'pfotoruim@teste.com').get_json()['token']

    resp = client.post('/api/medicamentos', json={
        "nome": "Levodopa", "dosagem": "100mg", "horario": "08:00",
        "foto": "isso-nao-e-uma-imagem-base64"
    }, headers=auth_header(token))

    assert resp.status_code == 400


def test_cuidador_cadastra_medicamento_para_paciente_vinculado(client):
    token_paciente, token_cuidador, paciente_id = _paciente_e_cuidador_vinculados(client, sufixo='1')

    resp = client.post('/api/medicamentos', json={
        "nome": "Carbidopa", "dosagem": "25mg", "horario": "09:00",
        "foto": FOTO_VALIDA, "paciente_id": paciente_id
    }, headers=auth_header(token_cuidador))

    assert resp.status_code == 201

    # O medicamento deve aparecer para o PACIENTE (não para o cuidador)
    medicamentos_paciente = client.get('/api/medicamentos', headers=auth_header(token_paciente)).get_json()
    assert len(medicamentos_paciente) == 1
    assert medicamentos_paciente[0]['nome'] == 'Carbidopa'


def test_cuidador_sem_informar_paciente_id_e_rejeitado(client):
    _, token_cuidador, _ = _paciente_e_cuidador_vinculados(client, sufixo='2')

    resp = client.post('/api/medicamentos', json={
        "nome": "Carbidopa", "dosagem": "25mg", "horario": "09:00"
    }, headers=auth_header(token_cuidador))

    assert resp.status_code == 400


def test_cuidador_nao_gerencia_medicamento_de_paciente_nao_vinculado(client):
    cadastrar(client, 'poutro@teste.com', tipo='paciente')
    token_outro_paciente = login(client, 'poutro@teste.com').get_json()['token']
    outro_paciente_id = client.get('/api/perfil', headers=auth_header(token_outro_paciente)).get_json()['id']

    _, token_cuidador, _ = _paciente_e_cuidador_vinculados(client, sufixo='3')

    resp = client.post('/api/medicamentos', json={
        "nome": "Carbidopa", "dosagem": "25mg", "horario": "09:00",
        "paciente_id": outro_paciente_id
    }, headers=auth_header(token_cuidador))

    assert resp.status_code == 403


def test_cuidador_lista_medicamentos_do_paciente_vinculado(client):
    token_paciente, token_cuidador, paciente_id = _paciente_e_cuidador_vinculados(client, sufixo='4')
    client.post('/api/medicamentos', json={
        "nome": "Levodopa", "dosagem": "100mg", "horario": "08:00"
    }, headers=auth_header(token_paciente))

    resp = client.get(f'/api/medicamentos?paciente_id={paciente_id}', headers=auth_header(token_cuidador))
    assert resp.status_code == 200
    assert len(resp.get_json()) == 1


def test_editar_medicamento_troca_a_foto(client):
    cadastrar(client, 'peditar@teste.com', tipo='paciente')
    token = login(client, 'peditar@teste.com').get_json()['token']

    criado = client.post('/api/medicamentos', json={
        "nome": "Levodopa", "dosagem": "100mg", "horario": "08:00"
    }, headers=auth_header(token)).get_json()

    resp = client.put(f"/api/medicamentos/{criado['id']}", json={"foto": FOTO_VALIDA}, headers=auth_header(token))
    assert resp.status_code == 200
    assert resp.get_json()['foto'] is not None
