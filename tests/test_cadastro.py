from conftest import cadastrar, login


def test_cadastro_paciente_salva_contato_de_emergencia(client):
    resp = cadastrar(
        client, 'paciente@teste.com', tipo='paciente',
        nome_contato='Filho', whatsapp='84999998888'
    )
    assert resp.status_code == 201
    assert resp.get_json()['tipo'] == 'paciente'

    token = login(client, 'paciente@teste.com').get_json()['token']
    perfil = client.get('/api/perfil', headers={'Authorization': f'Bearer {token}'}).get_json()

    assert perfil['whatsapp'] == '84999998888'
    assert perfil['nome_contato'] == 'Filho'
    # Paciente recebe um código de vínculo para compartilhar com o cuidador
    assert perfil['codigo_vinculo']
    assert len(perfil['codigo_vinculo']) == 6


def test_cadastro_cuidador_nao_recebe_codigo_vinculo(client):
    resp = cadastrar(
        client, 'cuidador@teste.com', tipo='cuidador',
    )
    assert resp.status_code == 201
    assert resp.get_json()['tipo'] == 'cuidador'

    token = login(client, 'cuidador@teste.com').get_json()['token']
    perfil = client.get('/api/perfil', headers={'Authorization': f'Bearer {token}'}).get_json()

    # Cuidador não recebe código de vínculo (quem gera é o paciente)
    assert perfil['codigo_vinculo'] is None


def test_tipo_invalido_cai_para_paciente(client):
    resp = cadastrar(client, 'estranho@teste.com', tipo='algo-invalido')
    assert resp.status_code == 201
    assert resp.get_json()['tipo'] == 'paciente'


def test_email_duplicado_e_rejeitado(client):
    cadastrar(client, 'duplicado@teste.com')
    resp = cadastrar(client, 'duplicado@teste.com')
    assert resp.status_code == 400


def test_login_retorna_tipo_do_usuario(client):
    cadastrar(client, 'paciente2@teste.com', tipo='paciente')
    cadastrar(client, 'cuidador2@teste.com', tipo='cuidador')

    resp_paciente = login(client, 'paciente2@teste.com')
    resp_cuidador = login(client, 'cuidador2@teste.com')

    assert resp_paciente.get_json()['tipo'] == 'paciente'
    assert resp_cuidador.get_json()['tipo'] == 'cuidador'
