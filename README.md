# Noticías

Um site para busca de notícias com backend em Python + FastAPI e frontend em HTML/CSS/JS. 

O projeto consome APIs públicas para exibir notícias financeiras e clima da localização do usuário.

---

## Funcionalidades

- Registro e login de usuário com autenticação via JWT
- Dashboard com notícias financeiras (API NewsAPI.org)
- Exibição do clima local via API WeatherAPI.com
- Pesquisa dinâmica de notícias por palavra-chave ou título
- Frontend responsivo, com tema azul e verde
- Armazenamento simples de usuários em SQLite

---

## Tecnologias

- Backend: Python, FastAPI, SQLite, JWT
- Frontend: HTML, CSS, JavaScript
- APIs: [NewsAPI.org](https://newsapi.org/), [WeatherAPI.com](https://www.weatherapi.com/)

---

## Como usar

### Pré-requisitos

- Python 3.8+
- pip

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/monitor-financeiro.git
cd monitor-financeiro
```

2. Instale as dependências:

```bash
pip install -r requirements.txt
```

3. Crie o arquivo `.env` na raiz do projeto com as chaves da API e JWT:

```env
JWT_SECRET=sua_chave_jwt_aqui
NEWSAPI_API_KEY=sua_chave_newsapi_aqui
WEATHER_API_KEY=sua_chave_weatherapi_aqui
```

4. Ajuste as origens:

Alterar o valor da API_BASE_URL para o local onde seu backend estiver hospedado.
Alterar as origens na main.py > add_middleware para onde seu frontend estiver hospedado.

5. Rode o servidor:

```bash
uvicorn main:app --reload
```

6. Abra o navegador em `http://localhost:8000`

---

## Estrutura do projeto

```
MonitorFinanceiro/
│
├── main.py
├── .env
├── .gitignore
├── requirements.txt
└── static/
    ├── index.html
    ├── styles.css
    └── script.js
```

---

## Deploy

- Realize o deploy do frontend no vercel, selecionando a pasta static como fonte.
- Faça o deploy no railway, após adicionar as váriaveis de ambiente do .env e seus valores.

---

## Observações

- O armazenamento de senha é em texto puro para simplicidade. Em produção, use hashing (ex: bcrypt)
- O sistema é básico e pode ser expandido para múltiplas funcionalidades financeiras

---

## Autor

Daniel D.

---

## Licença

MIT License
