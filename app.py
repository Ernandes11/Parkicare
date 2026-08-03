from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import random
import string
from sqlalchemy import text

app = Flask(__name__, template_folder='templates', static_folder='static', static_url_path='/static')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'

# A chave secreta do JWT NUNCA deve ficar fixa no código-fonte versionado.
# Defina a variável de ambiente JWT_SECRET_KEY antes de rodar em produção,
# por exemplo:
#   export JWT_SECRET_KEY="uma-chave-bem-longa-e-aleatoria"
# Se não for definida, geramos uma chave aleatória por execução (apenas
# para facilitar rodar localmente em desenvolvimento) e avisamos no console.
_jwt_secret = os.environ.get('JWT_SECRET_KEY')
if not _jwt_secret:
    import secrets
    _jwt_secret = secrets.token_hex(32)
    print(
        "[AVISO] JWT_SECRET_KEY não definida em variável de ambiente. "
        "Usando uma chave aleatória gerada apenas para esta execução "
        "(todos os tokens/logins serão invalidados ao reiniciar o servidor). "
        "Defina JWT_SECRET_KEY no seu ambiente antes de usar em produção."
    )
app.config['JWT_SECRET_KEY'] = _jwt_secret

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(200), nullable=False)
    nome = db.Column(db.String(120), nullable=False)
    tipo = db.Column(db.String(20), default='paciente')
    whatsapp = db.Column(db.String(20))
    whatsapp2 = db.Column(db.String(20))
    nome_contato = db.Column(db.String(120))
    nome_contato2 = db.Column(db.String(120))
    # Código curto que o paciente compartilha com o cuidador para se
    # vincularem. Só é gerado para usuários do tipo 'paciente'.
    codigo_vinculo = db.Column(db.String(10), unique=True, nullable=True)

class Vinculo(db.Model):
    """Liga um cuidador a um paciente que ele acompanha."""
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    cuidador_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('paciente_id', 'cuidador_id', name='uq_vinculo_paciente_cuidador'),
    )

class Medicamento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100))
    dosagem = db.Column(db.String(50))
    horario = db.Column(db.String(10))
    intervalo = db.Column(db.Integer, default=0)
    unidade = db.Column(db.String(20), default='mg')
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    tomado = db.Column(db.Boolean, default=False)

class Alerta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    tipo = db.Column(db.String(50), default='emergencia')
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    descricao = db.Column(db.Text)

def gerar_codigo_vinculo():
    """Gera um código curto e único (ex: 'A1B2C3') para o paciente
    compartilhar com o cuidador."""
    alfabeto = string.ascii_uppercase + string.digits
    for _ in range(20):
        codigo = ''.join(random.choices(alfabeto, k=6))
        if not Usuario.query.filter_by(codigo_vinculo=codigo).first():
            return codigo
    # Extremamente improvável de cair aqui, mas evita loop infinito
    return ''.join(random.choices(alfabeto, k=10))

# ========== ROTAS DE PÁGINAS HTML ==========

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def tela_login():
    return render_template('telalogin.html')

@app.route('/cadastro')
def tela_cadastro():
    return render_template('telacadastro.html')

@app.route('/inicial')
def tela_inicial():
    return render_template('telainicial.html')

@app.route('/cuidador')
def tela_cuidador():
    return render_template('telacuidador.html')

@app.route('/medicamentos')
def tela_medicamentos():
    return render_template('telamedicamento.html')

@app.route('/configs')
def tela_configs():
    return render_template('configs.html')

@app.route('/primeira')
@app.route('/telaprimeira.html')
@app.route('/telaprimeira')
def tela_primeira():
    return render_template('telaprimeira.html')

@app.route('/proxima')
@app.route('/telaproxima.html')
def tela_proxima():
    return render_template('telaproxima.html')

@app.route('/tremores')
@app.route('/teste.tremores.html')
def tela_tremores():
    return render_template('teste.tremores.html')

@app.route('/login.html')
@app.route('/telalogin.html')
def redirect_login():
    return tela_login()

@app.route('/cadastro.html')
@app.route('/telacadastro.html')
def redirect_cadastro():
    return tela_cadastro()

@app.route('/telainicial.html')
@app.route('/inicial.html')
def redirect_inicial():
    return tela_inicial()

# ========== ROTAS DE API ==========

@app.route('/api/cadastro', methods=['POST'])
def cadastro():
    try:
        data = request.json

        # Validações
        if not data.get('email') or not data.get('senha'):
            return jsonify({"erro": "Email e senha são obrigatórios"}), 400

        if not data.get('nome'):
            return jsonify({"erro": "Nome é obrigatório"}), 400

        if not data.get('nome_contato'):
            return jsonify({"erro": "Nome do contato de emergência é obrigatório"}), 400

        email = data['email'].lower().strip()

        # Validar se email já existe
        usuario_existente = Usuario.query.filter_by(email=email).first()
        if usuario_existente:
            return jsonify({"erro": "Este email já está cadastrado"}), 400

        # Tipo: apenas 'paciente' ou 'cuidador' são válidos
        tipo = data.get('tipo', 'paciente')
        if tipo not in ('paciente', 'cuidador'):
            tipo = 'paciente'

        # Criar novo usuário
        senha_hash = generate_password_hash(data['senha'])

        # Cuidadores não têm contatos de emergência nem código de vínculo
        if tipo == 'cuidador':
            user = Usuario(
                email=email,
                senha=senha_hash,
                nome=data.get('nome', '').strip(),
                tipo=tipo,
                codigo_vinculo=None
            )
        else:
            user = Usuario(
                email=email,
                senha=senha_hash,
                nome=data.get('nome', '').strip(),
                tipo=tipo,
                whatsapp=data.get('whatsapp', '').strip(),
                whatsapp2=data.get('whatsapp2', '').strip(),
                nome_contato=data.get('nome_contato', '').strip(),
                nome_contato2=data.get('nome_contato2', '').strip(),
                # Só pacientes recebem um código de vínculo (é o que o
                # cuidador vai usar para se conectar a ele).
                codigo_vinculo=gerar_codigo_vinculo()
            )

        db.session.add(user)
        db.session.commit()

        print(f"[CADASTRO] Novo usuário criado: {email} (tipo: {tipo})")
        return jsonify({"msg": "Cadastro realizado com sucesso", "tipo": tipo}), 201
    except Exception as e:
        db.session.rollback()
        print(f"[ERRO CADASTRO] {str(e)}")
        return jsonify({"erro": f"Erro no cadastro: {str(e)}"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json

        if not data.get('email') or not data.get('senha'):
            return jsonify({"erro": "Email e senha são obrigatórios"}), 400

        email = data['email'].lower().strip()
        user = Usuario.query.filter_by(email=email).first()

        if not user:
            print(f"[LOGIN] Usuário não encontrado: {email}")
            return jsonify({"erro": "Email ou senha incorretos"}), 401

        if not check_password_hash(user.senha, data['senha']):
            print(f"[LOGIN] Senha incorreta para: {email}")
            return jsonify({"erro": "Email ou senha incorretos"}), 401

        token = create_access_token(identity=str(user.id))
        print(f"[LOGIN] Login bem-sucedido: {email} (tipo: {user.tipo})")
        return jsonify({"token": token, "usuario_id": user.id, "tipo": user.tipo}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[ERRO LOGIN] {str(e)}")
        return jsonify({"erro": f"Erro no servidor: {str(e)}"}), 500

@app.route('/api/medicamentos', methods=['GET'])
@jwt_required()
def listar():
    try:
        user_id = int(get_jwt_identity())
        meds = Medicamento.query.filter_by(usuario_id=user_id).all()
        return jsonify([{
            "id": m.id,
            "nome": m.nome,
            "dosagem": m.dosagem,
            "horario": m.horario or '',
            "intervalo": m.intervalo or 0,
            "unidade": m.unidade or 'mg',
            "tomado": m.tomado
        } for m in meds]), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/medicamentos', methods=['POST'])
@jwt_required()
def salvar():
    try:
        data = request.json
        user_id = int(get_jwt_identity())
        med = Medicamento(
            nome=data['nome'],
            dosagem=data['dosagem'],
            horario=data.get('horario'),
            intervalo=data.get('intervalo', 0),
            unidade=data.get('unidade', 'mg'),
            usuario_id=user_id
        )
        db.session.add(med)
        db.session.commit()
        return jsonify({"msg": "Medicamento salvo", "id": med.id, "nome": med.nome}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/api/medicamentos/<int:med_id>', methods=['DELETE'])
@jwt_required()
def deletar_medicamento(med_id):
    try:
        user_id = int(get_jwt_identity())
        med = Medicamento.query.filter_by(id=med_id, usuario_id=user_id).first()
        if not med:
            return jsonify({"erro": "Medicamento não encontrado"}), 404
        db.session.delete(med)
        db.session.commit()
        return jsonify({"msg": "Medicamento deletado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/api/medicamentos/<int:med_id>/status', methods=['PUT'])
@jwt_required()
def atualizar_status(med_id):
    try:
        user_id = int(get_jwt_identity())
        med = Medicamento.query.filter_by(id=med_id, usuario_id=user_id).first()
        if not med:
            return jsonify({"erro": "Medicamento não encontrado"}), 404

        data = request.json
        med.tomado = data.get('tomado', not med.tomado)
        db.session.commit()
        return jsonify({"msg": "Status atualizado", "tomado": med.tomado}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/api/perfil', methods=['GET'])
@jwt_required()
def get_perfil():
    try:
        user_id = int(get_jwt_identity())
        user = Usuario.query.get(user_id)
        if not user:
            return jsonify({"erro": "Usuário não encontrado"}), 404

        return jsonify({
            "id": user.id,
            "nome": user.nome,
            "email": user.email,
            "tipo": user.tipo,
            "whatsapp": user.whatsapp,
            "whatsapp2": user.whatsapp2,
            "nome_contato": user.nome_contato,
            "nome_contato2": user.nome_contato2,
            "codigo_vinculo": user.codigo_vinculo
        }), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/perfil', methods=['PUT'])
@jwt_required()
def update_perfil():
    try:
        user_id = int(get_jwt_identity())
        user = Usuario.query.get(user_id)
        if not user:
            return jsonify({"erro": "Usuário não encontrado"}), 404

        data = request.json
        if 'nome' in data: user.nome = data['nome']
        if 'whatsapp' in data: user.whatsapp = data['whatsapp']
        if 'whatsapp2' in data: user.whatsapp2 = data['whatsapp2']
        if 'nome_contato' in data: user.nome_contato = data['nome_contato']
        if 'nome_contato2' in data: user.nome_contato2 = data['nome_contato2']

        db.session.commit()
        return jsonify({"msg": "Perfil atualizado com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/api/emergencia', methods=['POST'])
@jwt_required()
def enviar_emergencia():
    try:
        user_id = int(get_jwt_identity())
        paciente = Usuario.query.get(user_id)
        data = request.json or {}

        # Salvar alerta de emergência no banco
        alerta = Alerta(
            usuario_id=user_id,
            tipo=data.get('tipo', 'emergencia'),
            descricao=data.get('descricao', 'Alerta de emergência enviado')
        )
        db.session.add(alerta)
        db.session.commit()

        # Quem é notificado:
        # 1) os contatos de emergência cadastrados (o front-end chama o
        #    WhatsApp diretamente para cada um deles)
        # 2) todo cuidador vinculado a este paciente, que passa a ver o
        #    alerta na própria tela do cuidador (GET /api/vinculo/alertas)
        cuidadores_vinculados = (
            db.session.query(Usuario)
            .join(Vinculo, Vinculo.cuidador_id == Usuario.id)
            .filter(Vinculo.paciente_id == user_id)
            .all()
        )

        return jsonify({
            "msg": "Alerta de emergência enviado com sucesso",
            "alerta_id": alerta.id,
            "notificados": {
                "contatos": [
                    c for c in [
                        (paciente.nome_contato if paciente and paciente.whatsapp else None),
                        (paciente.nome_contato2 if paciente and paciente.whatsapp2 else None),
                    ] if c
                ],
                "cuidadores": [c.nome for c in cuidadores_vinculados]
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

# ========== ROTAS DE VÍNCULO CUIDADOR <-> PACIENTE ==========

@app.route('/api/vinculo', methods=['POST'])
@jwt_required()
def criar_vinculo():
    """Cuidador informa o código do paciente para se vincular a ele."""
    try:
        cuidador_id = int(get_jwt_identity())
        cuidador = Usuario.query.get(cuidador_id)
        if not cuidador:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        if cuidador.tipo != 'cuidador':
            return jsonify({"erro": "Apenas cuidadores podem se vincular a um paciente"}), 403

        data = request.json or {}
        codigo = (data.get('codigo') or '').strip().upper()
        if not codigo:
            return jsonify({"erro": "Informe o código do paciente"}), 400

        paciente = Usuario.query.filter_by(codigo_vinculo=codigo, tipo='paciente').first()
        if not paciente:
            return jsonify({"erro": "Código inválido. Confira com o paciente e tente novamente."}), 404

        ja_vinculado = Vinculo.query.filter_by(paciente_id=paciente.id, cuidador_id=cuidador_id).first()
        if ja_vinculado:
            return jsonify({"erro": "Você já está vinculado a este paciente"}), 400

        vinculo = Vinculo(paciente_id=paciente.id, cuidador_id=cuidador_id)
        db.session.add(vinculo)
        db.session.commit()

        return jsonify({
            "msg": f"Vinculado a {paciente.nome} com sucesso",
            "paciente": {"id": paciente.id, "nome": paciente.nome, "email": paciente.email}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/api/vinculo/pacientes', methods=['GET'])
@jwt_required()
def listar_pacientes_vinculados():
    """Lista os pacientes acompanhados pelo cuidador logado."""
    try:
        cuidador_id = int(get_jwt_identity())
        pacientes = (
            db.session.query(Usuario, Vinculo.id.label('vinculo_id'))
            .join(Vinculo, Vinculo.paciente_id == Usuario.id)
            .filter(Vinculo.cuidador_id == cuidador_id)
            .all()
        )
        return jsonify([
            {"vinculo_id": vinculo_id, "id": u.id, "nome": u.nome, "email": u.email}
            for u, vinculo_id in pacientes
        ]), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/vinculo/<int:vinculo_id>', methods=['DELETE'])
@jwt_required()
def remover_vinculo(vinculo_id):
    """Cuidador desfaz o vínculo com um paciente."""
    try:
        cuidador_id = int(get_jwt_identity())
        vinculo = Vinculo.query.filter_by(id=vinculo_id, cuidador_id=cuidador_id).first()
        if not vinculo:
            return jsonify({"erro": "Vínculo não encontrado"}), 404
        db.session.delete(vinculo)
        db.session.commit()
        return jsonify({"msg": "Vínculo removido"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/api/vinculo/alertas', methods=['GET'])
@jwt_required()
def alertas_dos_pacientes_vinculados():
    """Alertas de emergência recentes de todos os pacientes vinculados
    ao cuidador logado — é assim que o cuidador 'recebe' o alerta."""
    try:
        cuidador_id = int(get_jwt_identity())
        alertas = (
            db.session.query(Alerta, Usuario.nome.label('paciente_nome'))
            .join(Vinculo, Vinculo.paciente_id == Alerta.usuario_id)
            .join(Usuario, Usuario.id == Alerta.usuario_id)
            .filter(Vinculo.cuidador_id == cuidador_id)
            .order_by(Alerta.timestamp.desc())
            .limit(30)
            .all()
        )
        return jsonify([
            {
                "id": a.id,
                "paciente_nome": nome,
                "tipo": a.tipo,
                "descricao": a.descricao,
                "timestamp": a.timestamp.isoformat() if a.timestamp else None
            }
            for a, nome in alertas
        ]), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/vinculo/meus-cuidadores', methods=['GET'])
@jwt_required()
def meus_cuidadores():
    """Paciente vê quais cuidadores estão vinculados a ele (útil para
    mostrar, antes de disparar uma emergência, quem mais vai ser avisado)."""
    try:
        user_id = int(get_jwt_identity())
        cuidadores = (
            db.session.query(Usuario)
            .join(Vinculo, Vinculo.cuidador_id == Usuario.id)
            .filter(Vinculo.paciente_id == user_id)
            .all()
        )
        return jsonify([{"id": c.id, "nome": c.nome} for c in cuidadores]), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    return jsonify({"msg": "Logout realizado"}), 200

@app.route('/api/relatorio', methods=['GET'])
@jwt_required()
def relatorio():
    """Retorna o historico de medicamentos do usuario para exportar como CSV."""
    try:
        user_id = int(get_jwt_identity())
        meds = Medicamento.query.filter_by(usuario_id=user_id).all()
        return jsonify([{
            "nome": m.nome,
            "dosagem": m.dosagem,
            "horario": m.horario or '',
            "intervalo": m.intervalo or 0,
            "unidade": m.unidade or 'mg',
            "status": 'Tomado' if m.tomado else 'Pendente'
        } for m in meds]), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

def aplicar_migracoes_simples():
    """Adiciona colunas novas sem recriar o banco (compatível com SQLite)."""
    try:
        colunas = [row[1] for row in db.session.execute(text("PRAGMA table_info(usuario)")).fetchall()]

        if 'tipo' not in colunas:
            db.session.execute(text("ALTER TABLE usuario ADD COLUMN tipo VARCHAR(20) DEFAULT 'paciente'"))
            db.session.commit()
            print("[MIGRACAO] Coluna 'tipo' adicionada à tabela usuario")

        colunas = [row[1] for row in db.session.execute(text("PRAGMA table_info(usuario)")).fetchall()]
        if 'codigo_vinculo' not in colunas:
            db.session.execute(text("ALTER TABLE usuario ADD COLUMN codigo_vinculo VARCHAR(10)"))
            db.session.commit()
            print("[MIGRACAO] Coluna 'codigo_vinculo' adicionada à tabela usuario")

        # Gera o código de vínculo para pacientes que já existiam e ainda
        # não têm um (contas criadas antes desta funcionalidade existir).
        pacientes_sem_codigo = Usuario.query.filter(
            Usuario.tipo == 'paciente', Usuario.codigo_vinculo.is_(None)
        ).all()
        for p in pacientes_sem_codigo:
            p.codigo_vinculo = gerar_codigo_vinculo()
        if pacientes_sem_codigo:
            db.session.commit()
            print(f"[MIGRACAO] Código de vínculo gerado para {len(pacientes_sem_codigo)} paciente(s) existente(s)")
    except Exception as e:
        print(f"[MIGRACAO] Aviso: {e}")

if __name__ == '__main__':
    with app.app_context():
        # Ensure instances directory exists
        if not os.path.exists('instance'):
            os.makedirs('instance')
        db.create_all()
        aplicar_migracoes_simples()
    app.run(debug=True, host='127.0.0.1', port=5000)
