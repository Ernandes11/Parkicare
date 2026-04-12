from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os

app = Flask(__name__, template_folder='templates', static_folder='static', static_url_path='/static')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['JWT_SECRET_KEY'] = 'parkicare-secret'

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(200), nullable=False)
    nome = db.Column(db.String(120), nullable=False)
    whatsapp = db.Column(db.String(20))
    whatsapp2 = db.Column(db.String(20))
    nome_contato = db.Column(db.String(120))
    nome_contato2 = db.Column(db.String(120))

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
        
        email = data['email'].lower().strip()
        
        # Validar se email já existe
        usuario_existente = Usuario.query.filter_by(email=email).first()
        if usuario_existente:
            return jsonify({"erro": "Este email já está cadastrado"}), 400
        
        # Criar novo usuário
        senha_hash = generate_password_hash(data['senha'])
        user = Usuario(
            email=email, 
            senha=senha_hash,
            nome=data.get('nome', '').strip(),
            whatsapp=data.get('whatsapp', '').strip(),
            whatsapp2=data.get('whatsapp2', '').strip(),
            nome_contato=data.get('nome_contato', '').strip(),
            nome_contato2=data.get('nome_contato2', '').strip()
        )
        db.session.add(user)
        db.session.commit()
        
        print(f"[CADASTRO] Novo usuário criado: {email}")
        return jsonify({"msg": "Cadastro realizado com sucesso"}), 201
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
        print(f"[LOGIN] Login bem-sucedido: {email}")
        return jsonify({"token": token, "usuario_id": user.id}), 200
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
            "whatsapp": user.whatsapp,
            "whatsapp2": user.whatsapp2,
            "nome_contato": user.nome_contato,
            "nome_contato2": user.nome_contato2
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
        data = request.json
        
        # Salvar alerta de emergência no banco
        alerta = Alerta(
            usuario_id=user_id,
            tipo=data.get('tipo', 'emergencia'),
            descricao=data.get('descricao', 'Alerta de emergência enviado')
        )
        db.session.add(alerta)
        db.session.commit()
        
        # Aqui você pode adicionar lógica para:
        # - Enviar SMS/WhatsApp para contatos de emergência
        # - Enviar email
        # - Notificar serviço de emergência
        # - Etc.
        
        return jsonify({
            "msg": "Alerta de emergência enviado com sucesso",
            "alerta_id": alerta.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    return jsonify({"msg": "Logout realizado"}), 200

@app.route('/api/relatorio', methods=['GET'])
@jwt_required()
def relatorio():
    """Retorna o histrico de medicamentos do usuario para exportar como CSV."""
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

if __name__ == '__main__':
    with app.app_context():
        # Ensure instances directory exists
        if not os.path.exists('instance'):
            os.makedirs('instance')
        db.create_all()
    app.run(debug=True, host='127.0.0.1', port=5000)
