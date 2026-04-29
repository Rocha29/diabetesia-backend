# DiabetesIA — Backend

Backend do projeto DiabetesIA, construído com Firebase Functions v2 e Express. Responsável por receber textos e imagens do app mobile, processá-los via IA e retornar análises relacionadas ao diabetes.

## Stack

- **Node.js 18**
- **Firebase Functions v2** — região `southamerica-east1`
- **Express 4**

## Estrutura do projeto

```
functions/
  src/
    app.js                  # Express app (rotas, middlewares)
    index.js                # Entrypoint Firebase Functions
    routes/
      analyze.js            # POST /analyze
    services/
      analyzeService.js     # Lógica de análise (mock → IA)
    providers/              # Clients de IA (Gemini, OpenAI, etc.)
    prompts/                # Templates de prompt
  package.json
  test-local.js             # Script de testes HTTP local
firebase.json
.firebaserc
```

## Pré-requisitos

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`

## Instalação

```bash
git clone git@github.com:Rocha29/diabetesia-backend.git
cd diabetesia-backend/functions
npm install
```

## Rodando localmente

```bash
# Emulador Firebase (recomendado)
npm run serve

# Ou diretamente via Node (para desenvolvimento rápido)
node test-local.js
```

O emulador sobe em `http://127.0.0.1:5001/<project-id>/southamerica-east1/api`.

## Endpoints

### `GET /health`

Verifica se o serviço está no ar.

**Resposta**
```json
{
  "status": "ok",
  "service": "diabetesia-backend"
}
```

---

### `POST /analyze`

Recebe texto e/ou imagem para análise.

**Request**
```json
{
  "text": "Meu nível de glicose está em 180 mg/dL",
  "imageBase64": "<base64 opcional>"
}
```

Pelo menos um dos campos (`text` ou `imageBase64`) é obrigatório.

**Resposta de sucesso**
```json
{
  "success": true,
  "data": {
    "summary": "...",
    "input": {
      "text": "...",
      "hasImage": false
    },
    "suggestions": [],
    "analyzedAt": "2026-04-29T00:00:00.000Z"
  }
}
```

**Resposta de erro (400)**
```json
{
  "success": false,
  "error": "At least one of 'text' or 'imageBase64' is required"
}
```

## Deploy

```bash
# A partir da raiz do projeto
firebase deploy --only functions
```

## Próximos passos

- [ ] Integrar provider de IA em `services/analyzeService.js`
- [ ] Adicionar autenticação Firebase Auth
- [ ] Criar endpoints adicionais conforme necessidade do app
