# ParkiCare - Guia de Setup e Uso

## ✅ Projeto adaptado para Flask!

Seu projeto agora está totalmente integrado com Flask e pronto para funcionar.

---

## 📋 Pré-requisitos

- Python 3.8+
- pip (gerenciador de pacotes Python)

---

## 🚀 Como rodar o projeto

### 1. Instalar dependências
```bash
pip install -r requirements.txt
```

### 2. Iniciar o servidor
```bash
python app.py
```

O servidor iniciará em: `http://127.0.0.1:5000`

### 3. Acessar a aplicação
Abra seu navegador e acesse:
```
http://127.0.0.1:5000/
```

---

## 📁 Estrutura do projeto

```
ParkiCare_corrigido/
│
├── app.py                    # Servidor Flask principal
├── requirements.txt          # Dependências Python
├── database.db              # Banco de dados SQLite (criado automaticamente)
│
├── templates/               # Arquivos HTML
│   ├── index.html
│   ├── telalogin.html       # Tela de login
│   ├── telacadastro.html    # Tela de cadastro
│   ├── telainicial.html     # Tela inicial
│   ├── telamedicamento.html # Tela de medicamentos
│   ├── configs.html         # Configurações
│   └── ... (outras páginas)
│
├── static/                  # Arquivos estáticos
│   ├── css/                 # Folhas de estilos
│   │   ├── telaininicial.css
│   │   ├── telacadastro.css
│   │   └── ...
│   ├── js/                  # Arquivos JavaScript
│   │   ├── telalogin.js
│   │   ├── telacadastro.js
│   │   └── ...
│   └── img/                 # Imagens e áudios
│       ├── logoParkicare.png
│       ├── icone_config.png
│       └── ...
```

---

## 🔗 Rotas disponíveis

### Páginas
- `/` - Página inicial
- `/login` - Tela de login
- `/cadastro` - Cadastro de novo usuário
- `/inicial` - Dashboard principal
- `/medicamentos` - Gerenciar medicamentos
- `/configs` - Configurações
- `/tremores` - Teste de tremores

### API (JSON)
- `POST /api/cadastro` - Cadastrar novo usuário
- `POST /api/login` - Fazer login
- `GET /api/medicamentos` - Listar medicamentos (requer token JWT)
- `POST /api/medicamentos` - Adicionar medicamento (requer token JWT)
- `PUT /api/medicamentos/<id>/status` - Atualizar status (requer token JWT)
- `DELETE /api/medicamentos/<id>` - Deletar medicamento (requer token JWT)

---

## 🔐 Autenticação

O projeto usa JWT (JSON Web Tokens) para autenticação. Quando o usuário faz login, recebe um token que deve ser enviado em cada requisição à API.

O token é armazenado em `localStorage` no navegador automaticamente.

---

## 💾 Banco de dados

O projeto usa SQLite com as seguintes tabelas:

### Usuário
- `id` (Integer, PK)
- `email` (String, unique)
- `senha` (String, hashed)
- `nome` (String)
- `whatsapp` (String)
- `whatsapp2` (String, opcional)

### Medicamento
- `id` (Integer, PK)
- `nome` (String)
- `dosagem` (String)
- `usuario_id` (FK para Usuario)
- `tomado` (Boolean)

---

## 🛠️ Mudanças realizadas

✅ Criada estrutura Flask com `templates/` e `static/`
✅ Movidos arquivos HTML para `templates/`
✅ Movidos arquivos CSS para `static/css/`
✅ Movidos arquivos JS para `static/js/`
✅ Movidas imagens para `static/img/`
✅ Atualizado `app.py` com todas as rotas necessárias
✅ Adicionado suporte a CORS
✅ Atualizado todos os caminhos em arquivos HTML e JS
✅ Adicionado `requirements.txt` com dependências

---

## 🚨 Troubleshooting

### Erro: "ModuleNotFoundError"
Certifique-se de que instalou as dependências:
```bash
pip install -r requirements.txt
```

### Erro: "Port 5000 is already in use"
Outra aplicação está usando a porta 5000. Você pode mudar no final do `app.py`:
```python
app.run(debug=True, host='127.0.0.1', port=5001)  # Mudar para 5001
```

### Banco de dados não está sendo criado
O banco é criado automaticamente na primeira execução. Se houver problemas, delete `database.db` e execute novamente.

---

## 📝 Notas

- Use o servidor de desenvolvimento apenas para testes
- Para produção, use um servidor WSGI como Gunicorn
- As senhas são criptografadas com werkzeug.security
- Os tokens JWT expiram em 15 minutos (configurável em `app.py`)

---

**Projeto pronto para uso! 🎉**
