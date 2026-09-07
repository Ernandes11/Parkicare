from conftest import cadastrar, login, auth_header

def _setup_vinculo(client, sufixo='chat'):
    cadastrar(client, f'paciente_{sufixo}@teste.com', tipo='paciente')
    cadastrar(client, f'cuidador_{sufixo}@teste.com', tipo='cuidador')

    token_paciente = login(client, f'paciente_{sufixo}@teste.com').get_json()['token']
    token_cuidador = login(client, f'cuidador_{sufixo}@teste.com').get_json()['token']

    perfil_paciente = client.get('/api/perfil', headers=auth_header(token_paciente)).get_json()
    perfil_cuidador = client.get('/api/perfil', headers=auth_header(token_cuidador)).get_json()

    codigo = perfil_paciente['codigo_vinculo']
    client.post('/api/vinculo', json={"codigo": codigo}, headers=auth_header(token_cuidador))

    return token_paciente, token_cuidador, perfil_paciente['id'], perfil_cuidador['id']

def test_chat_nao_vinculado_rejeitado(client):
    cadastrar(client, 'p_solto@teste.com', tipo='paciente')
    cadastrar(client, 'c_solto@teste.com', tipo='cuidador')

    t_paciente = login(client, 'p_solto@teste.com').get_json()['token']
    p_cuidador = client.get('/api/perfil', headers=auth_header(login(client, 'c_solto@teste.com').get_json()['token'])).get_json()

    resp = client.post('/api/chat/enviar', json={
        "destinatario_id": p_cuidador['id'],
        "conteudo": "Olá sem vinculo"
    }, headers=auth_header(t_paciente))

    assert resp.status_code == 403
    assert "vincul" in resp.get_json()['erro'].lower()

def test_troca_de_mensagens_chat(client):
    token_p, token_c, p_id, c_id = _setup_vinculo(client, sufixo='1')

    # Paciente envia mensagem para cuidador
    resp = client.post('/api/chat/enviar', json={
        "destinatario_id": c_id,
        "conteudo": "Olá cuidador, tomei meu remédio!"
    }, headers=auth_header(token_p))
    assert resp.status_code == 201

    # Cuidador lista contatos e vê 1 não lida
    contatos = client.get('/api/chat/contatos', headers=auth_header(token_c)).get_json()
    assert len(contatos) == 1
    assert contatos[0]['nao_lidas'] == 1
    assert contatos[0]['ultima_mensagem'] == "Olá cuidador, tomei meu remédio!"

    # Cuidador lê mensagens
    msgs = client.get(f'/api/chat/mensagens/{p_id}', headers=auth_header(token_c)).get_json()
    assert len(msgs) == 1
    assert msgs[0]['conteudo'] == "Olá cuidador, tomei meu remédio!"

    # Cuidador responde
    resp_c = client.post('/api/chat/enviar', json={
        "destinatario_id": p_id,
        "conteudo": "Excelente! Continue assim."
    }, headers=auth_header(token_c))
    assert resp_c.status_code == 201

    # Paciente lê mensagens trocadas
    msgs_p = client.get(f'/api/chat/mensagens/{c_id}', headers=auth_header(token_p)).get_json()
    assert len(msgs_p) == 2
    assert msgs_p[0]['sou_eu'] is True
    assert msgs_p[1]['sou_eu'] is False
    assert msgs_p[1]['conteudo'] == "Excelente! Continue assim."
