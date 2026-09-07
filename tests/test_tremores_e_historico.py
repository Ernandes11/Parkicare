import pytest
from conftest import cadastrar, login, auth_header


def test_salvar_e_listar_tremores(client):
    cadastrar(client, 'paciente_tremor@test.com', 'paciente', senha='senha1234')
    res_login = login(client, 'paciente_tremor@test.com', 'senha1234')
    token = res_login.json['token']

    # Salvar teste de tremor
    res_post = client.post('/api/tremores', json={
        'pontuacao': 88.5,
        'desvio': 2.1
    }, headers=auth_header(token))
    assert res_post.status_code == 201
    assert res_post.json['pontuacao'] == 88.5

    # Listar testes de tremor
    res_get = client.get('/api/tremores', headers=auth_header(token))
    assert res_get.status_code == 200
    assert len(res_get.json) == 1
    assert res_get.json[0]['pontuacao'] == 88.5


def test_historico_medicamentos(client):
    cadastrar(client, 'paciente_hist@test.com', 'paciente', senha='senha1234')
    res_login = login(client, 'paciente_hist@test.com', 'senha1234')
    token = res_login.json['token']

    # Criar med
    res_med = client.post('/api/medicamentos', json={
        'nome': 'Levodopa',
        'dosagem': '100mg',
        'horario': '08:00'
    }, headers=auth_header(token))
    assert res_med.status_code == 201
    med_id = res_med.json['id']

    # Atualizar status para tomado (gera log de histórico)
    res_status = client.put(f'/api/medicamentos/{med_id}/status', json={
        'tomado': True
    }, headers=auth_header(token))
    assert res_status.status_code == 200

    # Buscar histórico
    res_hist = client.get('/api/medicamentos/historico', headers=auth_header(token))
    assert res_hist.status_code == 200
    assert len(res_hist.json) == 1
    assert res_hist.json[0]['nome_medicamento'] == 'Levodopa'
    assert res_hist.json[0]['status'] == 'Tomado'
