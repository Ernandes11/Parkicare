import os
import sys

# Garante uma JWT_SECRET_KEY previsível/definida antes de importar o app,
# assim os testes não dependem da chave aleatória gerada em desenvolvimento.
os.environ.setdefault('JWT_SECRET_KEY', 'chave-de-teste-nao-use-em-producao')

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import app as app_module


@pytest.fixture()
def client():
    """Cliente de teste Flask com um banco SQLite em memória, isolado do
    banco de dados real usado em desenvolvimento/produção."""
    app_module.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app_module.app.config['TESTING'] = True

    with app_module.app.app_context():
        app_module.db.create_all()

    with app_module.app.test_client() as test_client:
        yield test_client

    with app_module.app.app_context():
        app_module.db.session.remove()
        app_module.db.drop_all()


def cadastrar(client, email, tipo='paciente', **extra):
    payload = {
        "nome": extra.pop('nome', 'Usuário Teste'),
        "email": email,
        "senha": extra.pop('senha', 'senha123'),
        "tipo": tipo,
    }
    if tipo == 'paciente' or tipo not in ('paciente', 'cuidador'):
        payload.setdefault('nome_contato', 'Contato de Emergência')
        payload.setdefault('whatsapp', '11999999999')
    payload.update(extra)
    return client.post('/api/cadastro', json=payload)


def login(client, email, senha='senha123'):
    return client.post('/api/login', json={"email": email, "senha": senha})


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}
