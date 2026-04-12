# ParkiCare 🎯

Um aplicativo web para gerenciamento de medicamentos e monitoramento de tremores, desenvolvido especialmente para pacientes com Parkinson.

## ✨ Funcionalidades

- 💊 **Gerenciamento de Medicamentos**: Cadastar, listar e acompanhar medicamentos
- 🚨 **Alerta de Emergência**: Sistema de alerta com contagem regressiva e notificações
- 📊 **Teste de Tremores**: Avaliação de motricidade fina
- 🔐 **Autenticação Segura**: Login e cadastro com JWT
- 📱 **Responsivo**: Interface adaptada para dispositivos móveis
- ♿ **Acessibilidade**: Suporte para navegação com teclado

---

## 🚀 Começando

### Pré-requisitos

- Python 3.8+
- pip (gerenciador de pacotes)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/nicollyfagundes8/ParkiCare.git
cd ParkiCare
```

2. **Crie um ambiente virtual**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

3. **Instale as dependências**
```bash
pip install -r requirements.txt
```

4. **Execute o servidor**
```bash
python app.py
```

5. **Acesse a aplicação**
Abra seu navegador em: `http://127.0.0.1:5000`

---

## 📁 Estrutura do Projeto

```
ParkiCare/
│
├── app.py                    # Servidor Flask principal
├── requirements.txt          # Dependências Python
├── README.md                 # Este arquivo
├── .gitignore               # Arquivos a ignorar no Git
│
├── templates/                # Arquivos HTML
│   ├── index.html
│   ├── telacadastro.html     # Cadastro
│   ├── telalogin.html        # Login
│   ├── telainicial.html      # Dashboard
│   ├── telamedicamento.html  # Gerência de medicamentos
│   ├── configs.html          # Configurações
│   └── teste.tremores.html   # Teste de tremores
│
├── static/                   # Arquivos estáticos
│   ├── css/                  # Estilos CSS
│   ├── js/                   # Scripts JavaScript
│   │   ├── utils.js          # Funções globais
│   │   ├── emergencia.js     # Sistema de emergência
│   │   └── ...
│   └── img/                  # Imagens e áudios
│
└── instance/
    └── database.db           # Banco de dados SQLite
```

---

## 🔗 Endpoints da API

### Autenticação
- `POST /api/cadastro` - Registrar novo usuário
- `POST /api/login` - Fazer login

### Medicamentos (requer autenticação JWT)
- `GET /api/medicamentos` - Listar medicamentos
- `POST /api/medicamentos` - Adicionar medicamento
- `PUT /api/medicamentos/<id>/status` - Atualizar status
- `DELETE /api/medicamentos/<id>` - Deletar medicamento

### Emergência (requer autenticação JWT)
- `POST /api/emergencia` - Enviar alerta de emergência

---

## 🔐 Autenticação

O projeto usa **JWT (JSON Web Tokens)** para autenticação:

1. Usuário faz login
2. Recebe um token que é armazenado em `localStorage`
3. Token é enviado em todas as requisições autenticadas
4. Servidor valida o token

---

## 📊 Banco de Dados

### Tabela: usuario
- `id` - Identificador único
- `email` - Email (único)
- `senha` - Senha (hash)
- `nome` - Nome completo
- `whatsapp` - Telefone de emergência
- `whatsapp2` - Segundo telefone (opcional)

### Tabela: medicamento
- `id` - Identificador único
- `nome` - Nome do medicamento
- `dosagem` - Dosagem
- `usuario_id` - ID do usuário (FK)
- `tomado` - Status de tomada (boolean)

### Tabela: alerta
- `id` - Identificador único
- `usuario_id` - ID do usuário (FK)
- `tipo` - Tipo de alerta
- `timestamp` - Data/hora
- `descricao` - Descrição

---

## 🛠️ Desenvolvimento

### Adicionar uma nova página

1. Crie o HTML em `templates/novo_page.html`
2. Crie a rota em `app.py`:
```python
@app.route('/nova-pagina')
def nova_pagina():
    return render_template('novo_page.html')
```

### Adicionar uma API

1. Crie a rota em `app.py`:
```python
@app.route('/api/novo-endpoint', methods=['POST'])
@jwt_required()
def novo_endpoint():
    data = request.json
    # Lógica aqui
    return jsonify({"msg": "Sucesso"}), 200
```

---

## 📝 Stack Tecnológico

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Banco de Dados**: SQLite
- **Autenticação**: JWT (Flask-JWT-Extended)
- **Segurança**: Werkzeug (password hashing)
- **CORS**: Flask-CORS

---

## 📝 Commits Recentes

- ✅ Adaptar projeto para Flask com estrutura MVC
- ✅ Implementar sistema de emergência com animações
- ✅ Melhorar autenticação e validações
- ✅ Adicionar .gitignore

---

## 🐛 Troubleshooting

**Erro: Port 5000 already in use**
```bash
# Mude a porta em app.py:
app.run(debug=True, host='127.0.0.1', port=5001)
```

**Erro: Database locked**
```bash
# Delete o banco e deixe ser recriado:
rm instance/database.db
python app.py
```

**Erro: ModuleNotFoundError**
```bash
# Reinstale as dependências:
pip install --upgrade -r requirements.txt
```

---

## 🚀 Próximos Passos

- [ ] Integração com WhatsApp API para alertas de emergência
- [ ] Dashboard com histórico de medicamentos
- [ ] Notificações push
- [ ] Sincronização com contatos de emergência
- [ ] Análise de dados de tremores
- [ ] Interface mobile nativa

---

## 📄 Licença

Este projeto é de código aberto e pode ser usado livremente.

---

## 👨‍💻 Desenvolvimento

**GitHub**: [nicollyfagundes8/ParkiCare](https://github.com/nicollyfagundes8/ParkiCare)

Desenvolvido para o projeto ParkiCare - Cuidados com Parkinson

**Última atualização**: 12 de Abril de 2026
