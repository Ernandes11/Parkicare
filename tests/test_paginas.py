from conftest import cadastrar


def test_tela_motricidade_fina_tem_viewport_responsivo(client):
    """Regressão: essa era a causa raiz da tela não funcionar em
    smartphones — sem a meta viewport o navegador mobile renderiza a
    página como se fosse desktop."""
    resp = client.get('/tremores')
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert 'name="viewport"' in html
    assert 'width=device-width' in html


def test_todas_as_telas_html_tem_meta_viewport(client):
    # A rota "/" é só uma página de redirecionamento automático para
    # /primeira, não uma tela navegável de verdade — por isso fica de fora.
    rotas = ['/login', '/cadastro', '/inicial', '/cuidador',
             '/medicamentos', '/configs', '/tremores', '/proxima', '/primeira']
    for rota in rotas:
        resp = client.get(rota)
        html = resp.get_data(as_text=True)
        assert resp.status_code == 200, f'Rota {rota} falhou'
        assert 'name="viewport"' in html, f'Rota {rota} está sem meta viewport'


def test_canvas_de_desenho_tem_suporte_a_toque_no_js():
    """Regressão: o canvas só respondia a mouse, então era impossível
    desenhar com o dedo em um celular de verdade."""
    with open('static/js/teste.tremores.js', encoding='utf-8') as f:
        js = f.read()
    assert 'touchstart' in js
    assert 'touchmove' in js
    assert 'touchend' in js


def test_pagina_cadastro_tem_selecao_paciente_cuidador(client):
    resp = client.get('/cadastro')
    html = resp.get_data(as_text=True)
    assert 'tipo_paciente' in html
    assert 'tipo_cuidador' in html
