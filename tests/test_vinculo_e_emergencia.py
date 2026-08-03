from conftest import cadastrar, login, auth_header


def _criar_paciente_e_cuidador(client, sufixo=''):
    cadastrar(client, f'paciente{sufixo}@teste.com', tipo='paciente')
    cadastrar(client, f'cuidador{sufixo}@teste.com', tipo='cuidador')

    token_paciente = login(client, f'paciente{sufixo}@teste.com').get_json()['token']
    token_cuidador = login(client, f'cuidador{sufixo}@teste.com').get_json()['token']

    codigo = client.get('/api/perfil', headers=auth_header(token_paciente)).get_json()['codigo_vinculo']

    return token_paciente, token_cuidador, codigo


def test_cuidador_vincula_com_codigo_valido(client):
    token_paciente, token_cuidador, codigo = _criar_paciente_e_cuidador(client)

    resp = client.post('/api/vinculo', json={"codigo": codigo}, headers=auth_header(token_cuidador))
    assert resp.status_code == 201

    pacientes = client.get('/api/vinculo/pacientes', headers=auth_header(token_cuidador)).get_json()
    assert len(pacientes) == 1
    assert pacientes[0]['nome']


def test_vinculo_com_codigo_invalido_falha(client):
    _, token_cuidador, _ = _criar_paciente_e_cuidador(client)

    resp = client.post('/api/vinculo', json={"codigo": "ZZZZZZ"}, headers=auth_header(token_cuidador))
    assert resp.status_code == 404


def test_vinculo_duplicado_e_rejeitado(client):
    token_paciente, token_cuidador, codigo = _criar_paciente_e_cuidador(client)

    primeiro = client.post('/api/vinculo', json={"codigo": codigo}, headers=auth_header(token_cuidador))
    segundo = client.post('/api/vinculo', json={"codigo": codigo}, headers=auth_header(token_cuidador))

    assert primeiro.status_code == 201
    assert segundo.status_code == 400


def test_paciente_nao_pode_criar_vinculo(client):
    cadastrar(client, 'sopaciente@teste.com', tipo='paciente')
    token = login(client, 'sopaciente@teste.com').get_json()['token']

    resp = client.post('/api/vinculo', json={"codigo": "ABC123"}, headers=auth_header(token))
    assert resp.status_code == 403


def test_cuidador_recebe_alerta_de_emergencia_do_paciente_vinculado(client):
    token_paciente, token_cuidador, codigo = _criar_paciente_e_cuidador(client, sufixo='2')
    client.post('/api/vinculo', json={"codigo": codigo}, headers=auth_header(token_cuidador))

    # Paciente dispara o botão de emergência
    resp_emergencia = client.post(
        '/api/emergencia',
        json={"tipo": "emergencia", "descricao": "Botão pressionado"},
        headers=auth_header(token_paciente)
    )
    assert resp_emergencia.status_code == 201
    notificados = resp_emergencia.get_json()['notificados']
    assert notificados.get('cuidadores')

    # Cuidador consulta os alertas e deve ver o alerta desse paciente
    alertas = client.get('/api/vinculo/alertas', headers=auth_header(token_cuidador)).get_json()
    assert len(alertas) == 1
    assert alertas[0]['tipo'] == 'emergencia'


def test_cuidador_nao_ve_alerta_de_paciente_nao_vinculado(client):
    cadastrar(client, 'pacienteX@teste.com', tipo='paciente')
    cadastrar(client, 'cuidadorX@teste.com', tipo='cuidador')
    token_paciente = login(client, 'pacienteX@teste.com').get_json()['token']
    token_cuidador = login(client, 'cuidadorX@teste.com').get_json()['token']

    # Sem vínculo entre eles
    client.post('/api/emergencia', json={}, headers=auth_header(token_paciente))

    alertas = client.get('/api/vinculo/alertas', headers=auth_header(token_cuidador)).get_json()
    assert alertas == []


def test_paciente_ve_seus_cuidadores_vinculados(client):
    token_paciente, token_cuidador, codigo = _criar_paciente_e_cuidador(client, sufixo='3')
    client.post('/api/vinculo', json={"codigo": codigo}, headers=auth_header(token_cuidador))

    cuidadores = client.get('/api/vinculo/meus-cuidadores', headers=auth_header(token_paciente)).get_json()
    assert len(cuidadores) == 1


def test_remover_vinculo(client):
    token_paciente, token_cuidador, codigo = _criar_paciente_e_cuidador(client, sufixo='4')
    client.post('/api/vinculo', json={"codigo": codigo}, headers=auth_header(token_cuidador))

    pacientes = client.get('/api/vinculo/pacientes', headers=auth_header(token_cuidador)).get_json()
    vinculo_id = pacientes[0]['vinculo_id']

    resp = client.delete(f'/api/vinculo/{vinculo_id}', headers=auth_header(token_cuidador))
    assert resp.status_code == 200

    pacientes_depois = client.get('/api/vinculo/pacientes', headers=auth_header(token_cuidador)).get_json()
    assert pacientes_depois == []
