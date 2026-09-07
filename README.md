# ParkiCare 🎯

Um aplicativo web para gerenciamento de medicamentos e monitoramento de tremores, desenvolvido especialmente para pacientes com Parkinson.

🌐 **Acesse a aplicação ao vivo**: [https://parkicare-q40i.onrender.com/primeira](https://parkicare-q40i.onrender.com/primeira)

---

## ✨ Funcionalidades

- 💊 **Gerenciamento de Medicamentos**: Cadastrar, listar, registrar tomadas e acompanhar medicação com foto da caixa/cartela.
- 📜 **Dashboard com Histórico de Medicamentos**: Linha do tempo e histórico detalhado das doses registradas.
- 🚨 **Alerta de Emergência**: Sistema de alerta por WhatsApp com contagem regressiva e notificação simultânea para cuidadores vinculados.
- 📊 **Análise de Dados de Tremores**: Avaliação e pontuação de estabilidade da motricidade fina via desenho de espiral.
- 🔔 **Notificações Push**: Alertas sonoros, vibratórios e notificações nativas do sistema no horário dos remédios.
- 📱 **Interface Mobile Nativa (PWA)**: Aplicativo web progressivo instalável na tela inicial de dispositivos móveis.
- 🔐 **Autenticação Segura**: Login e cadastro com perfis distintos (Paciente e Cuidador) protegidos por JWT.
- ♿ **Acessibilidade**: Alto contraste, opções de tamanho de botões/fontes e suporte para navegabilidade adaptada.

---

## 🚀 Começando

### Link de Acesso Público
- 🌐 [https://parkicare-q40i.onrender.com/primeira](https://parkicare-q40i.onrender.com/primeira)

### Pré-requisitos para Execução Local

- Python 3.8+
- pip (gerenciador de pacotes)

### Instalação Local

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
├── README.md                 # Documentação principal
├── .gitignore                # Arquivos a ignorar no repositório Git
│
├── templates/                # Arquivos HTML das telas do sistema
│   ├── index.html            # Redirecionador inicial
│   ├── telacadastro.html     # Tela de cadastro (paciente ou cuidador)
│   ├── telalogin.html        # Tela de login
│   ├── telainicial.html      # Dashboard principal do paciente
│   ├── telacuidador.html     # Painel de acompanhamento do cuidador
│   ├── telamedicamento.html  # Gerenciamento de medicamentos
│   ├── configs.html          # Configurações e acessibilidade
│   ├── telaprimeira.html     # Tutorial inicial / Splash - Parte 1
│   ├── telaproxima.html      # Tutorial inicial - Parte 2
│   └── teste.tremores.html   # Teste de tremores (motricidade fina)
│
├── static/                   # Arquivos estáticos servidos pelo Flask
│   ├── manifest.json         # Manifest do PWA
│   ├── sw.js                 # Service Worker PWA
│   ├── css/                  # Estilos CSS de cada tela
│   ├── js/                   # Scripts JavaScript frontend e APIs
│   ├── audio/                # Som de alerta configurável
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

### Medicamentos & Histórico (requer autenticação JWT)
- `GET /api/medicamentos` - Listar todos os medicamentos do paciente logado
- `POST /api/medicamentos` - Adicionar novo medicamento
- `PUT /api/medicamentos/<id>/status` - Alternar status de tomada do medicamento (registra no histórico)
- `DELETE /api/medicamentos/<id>` - Remover um medicamento cadastrado
- `GET /api/medicamentos/historico` - Listar histórico detalhado de doses registradas
- `GET /api/relatorio` - Obter dados de medicamentos para exportação CSV

### Análise de Tremores (requer autenticação JWT)
- `POST /api/tremores` - Salvar pontuação e desvio do teste de motricidade fina
- `GET /api/tremores` - Listar histórico de testes de tremores

### Emergência (requer autenticação JWT)
- `POST /api/emergencia` - Disparar alerta de emergência, registrar no banco e notificar cuidadores

### Vínculo Cuidador & Paciente (requer autenticação JWT)
- `POST /api/vinculo` - Cuidador conecta-se a um paciente fornecendo o código de vínculo deste
- `GET /api/vinculo/pacientes` - Listar todos os pacientes vinculados ao cuidador
- `DELETE /api/vinculo/<id>` - Remover vínculo
- `GET /api/vinculo/alertas` - Listar os alertas de emergência dos pacientes vinculados

---

## 🔐 Autenticação

O projeto usa **JWT (JSON Web Tokens)** para proteger as rotas de dados.
1. Após login bem-sucedido via `POST /api/login`, o frontend armazena o token recebido no `localStorage`.
2. Em todas as requisições autenticadas subsequentes, o token deve ser incluído no cabeçalho HTTP:
   `Authorization: Bearer <seu_token>`

---

## 📊 Banco de Dados

O sistema utiliza SQLite com ORM SQLAlchemy:
- `usuario`: Dados cadastrais, perfil de paciente/cuidador, contatos de emergência e código de vínculo.
- `vinculo`: Relação entre cuidadores e pacientes acompanhados.
- `medicamento`: Informações dos remédios, foto da caixa/cartela e horários.
- `historico_medicamento`: Registro temporal das doses tomadas ou pendentes.
- `alerta`: Registro de emergências disparadas.
- `teste_tremores`: Histórico e pontuações do teste de estabilidade de motricidade fina.

---

## 📝 Stack Tecnológico

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript vanilla, PWA (Progressive Web App)
- **Banco de Dados**: SQLite / SQLAlchemy
- **Autenticação**: JWT (Flask-JWT-Extended)
- **Segurança**: Werkzeug (password hashing)
- **CORS**: Flask-CORS

---

## 🚀 Próximos Passos

- [ ] Suporte a relatórios médicos em formato PDF com gráficos de evolução
- [ ] Lembretes inteligentes baseados em localização

---

## 📄 Licença

Este projeto é de código aberto e pode ser usado livremente.

---

## 👨‍💻 Desenvolvimento

**Link Público Render**: [https://parkicare-q40i.onrender.com/primeira](https://parkicare-q40i.onrender.com/primeira)  
**GitHub**: [nicollyfagundes8/ParkiCare](https://github.com/nicollyfagundes8/ParkiCare)

Desenvolvido para o projeto ParkiCare - Cuidados com Parkinson
