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
├── app.py                    # Servidor Flask principal e APIs
├── requirements.txt          # Dependências Python (Flask, JWT, SQLAlchemy, etc.)
├── README.md                 # Este arquivo de documentação
├── .gitignore                # Arquivos a ignorar no repositório Git
│
├── templates/                # Arquivos HTML das telas do sistema
│   ├── index.html            # Tela de boas-vindas / Apresentação
│   ├── telacadastro.html     # Tela de cadastro (paciente ou cuidador)
│   ├── telalogin.html        # Tela de login
│   ├── telainicial.html      # Dashboard principal do paciente
│   ├── telacuidador.html     # Painel de acompanhamento do cuidador
│   ├── telamedicamento.html  # Gerenciamento de medicamentos
│   ├── configs.html          # Configurações e atualização do perfil
│   ├── telaprimeira.html     # Tutorial inicial - Parte 1
│   ├── telaproxima.html      # Tutorial inicial - Parte 2
│   └── teste.tremores.html   # Teste de tremores (motricidade fina)
│
├── static/                   # Arquivos estáticos servidos pelo Flask
│   ├── css/                  # Estilos CSS específicos de cada página/componente
│   ├── js/                   # Scripts JavaScript (lógica do frontend e APIs)
│   │   ├── utils.js          # Funções utilitárias globais
│   │   └── ...               # Outros scripts das telas
│   ├── audio/                # Arquivos de som do sistema
│   └── img/                  # Imagens e ícones
│
└── instance/
    └── database.db           # Banco de dados SQLite local
```

---

## 🔗 Endpoints da API

### Autenticação e Perfil
- `POST /api/cadastro` - Registrar novo usuário (paciente ou cuidador)
- `POST /api/login` - Fazer login e receber token JWT
- `POST /api/logout` - Realizar logout
- `GET /api/perfil` - Obter dados de perfil do usuário logado (requer JWT)
- `PUT /api/perfil` - Atualizar informações de perfil (requer JWT)

### Medicamentos (requer autenticação JWT)
- `GET /api/medicamentos` - Listar todos os medicamentos do paciente logado
- `POST /api/medicamentos` - Adicionar novo medicamento
- `PUT /api/medicamentos/<id>/status` - Alternar status de tomada do medicamento (marcar/desmarcar)
- `DELETE /api/medicamentos/<id>` - Remover um medicamento cadastrado
- `GET /api/relatorio` - Obter histórico de medicamentos para exportar relatório

### Emergência (requer autenticação JWT)
- `POST /api/emergencia` - Disparar alerta de emergência, registrar no banco de dados e retornar contatos/cuidadores cadastrados

### Vínculo Cuidador & Paciente (requer autenticação JWT)
- `POST /api/vinculo` - Cuidador conecta-se a um paciente fornecendo o código de vínculo deste
- `GET /api/vinculo/pacientes` - Listar todos os pacientes vinculados ao cuidador logado
- `DELETE /api/vinculo/<id>` - Cuidador remove o vínculo com um paciente específico
- `GET /api/vinculo/alertas` - Listar os alertas de emergência recentes de todos os pacientes vinculados ao cuidador
- `GET /api/vinculo/meus-cuidadores` - Paciente lista quais cuidadores estão vinculados ao seu perfil

---

## 🔐 Autenticação

O projeto usa **JWT (JSON Web Tokens)** para proteger as rotas de dados.
1. Após login bem-sucedido via `POST /api/login`, o frontend armazena o token recebido no `localStorage`.
2. Em todas as requisições autenticadas subsequentes, o token deve ser incluído no cabeçalho HTTP:
   `Authorization: Bearer <seu_token>`
3. O servidor valida o token e extrai a identidade do usuário.

---

## 📊 Banco de Dados

O sistema utiliza SQLite com ORM SQLAlchemy. A estrutura de tabelas é descrita a seguir:

### Tabela: `usuario`
- `id` (Integer, PK) - Identificador único do usuário.
- `email` (String, único) - E-mail de login.
- `senha` (String) - Hash criptografado da senha.
- `nome` (String) - Nome completo.
- `tipo` (String) - Define a função do usuário: `'paciente'` ou `'cuidador'`.
- `whatsapp` (String) - Telefone do primeiro contato de emergência (apenas para pacientes).
- `whatsapp2` (String) - Telefone do segundo contato de emergência (apenas para pacientes, opcional).
- `nome_contato` (String) - Nome do primeiro contato de emergência (apenas para pacientes).
- `nome_contato2` (String) - Nome do segundo contato de emergência (apenas para pacientes, opcional).
- `codigo_vinculo` (String, único) - Código gerado automaticamente para que o paciente o forneça ao seu cuidador.

### Tabela: `vinculo`
- `id` (Integer, PK) - Identificador único da relação.
- `paciente_id` (Integer, FK) - Referência ao `id` do paciente na tabela `usuario`.
- `cuidador_id` (Integer, FK) - Referência ao `id` do cuidador na tabela `usuario`.
- `criado_em` (DateTime) - Data e hora de criação do vínculo.
*(Nota: Há uma restrição única para evitar duplicidades no par paciente/cuidador).*

### Tabela: `medicamento`
- `id` (Integer, PK) - Identificador único do medicamento.
- `nome` (String) - Nome comercial ou princípio ativo.
- `dosagem` (String) - Concentração/dosagem do remédio (ex: "50mg", "1 comprimido").
- `horario` (String) - Horário definido para administração.
- `intervalo` (Integer) - Intervalo de tomada em horas (ex: 8 para 8 em 8h).
- `unidade` (String) - Unidade de medida (default: `'mg'`).
- `usuario_id` (Integer, FK) - ID do paciente dono deste medicamento.
- `tomado` (Boolean) - Status de tomada diária do medicamento.

### Tabela: `alerta`
- `id` (Integer, PK) - Identificador do alerta registrado.
- `usuario_id` (Integer, FK) - ID do paciente que disparou o alerta de emergência.
- `tipo` (String) - Tipo do alerta (ex: `'emergencia'`).
- `timestamp` (DateTime) - Data e hora exata do ocorrido.
- `descricao` (Text) - Detalhes adicionais sobre o alerta de emergência.

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
rm venv -rf (opcional)
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
