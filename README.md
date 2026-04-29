# DiabetesIA — Backend

Backend do projeto DiabetesIA, construído com Firebase Functions v2 e Express. Responsável por receber textos e imagens do app mobile, processá-los via IA e retornar análises nutricionais relacionadas ao diabetes.

## Stack

- **Node.js 18**
- **Firebase Functions v2** — região `southamerica-east1`
- **Express 4**
- **Groq API** — provedor principal (llama-3.3-70b / llama-3.2-vision)
- **DeepSeek API** — fallback automático

## Estrutura do projeto

```
functions/
  src/
    app.js                        # Express app (rotas, middlewares)
    index.js                      # Entrypoint Firebase Functions
    middleware/
      rateLimiter.js              # Trava de uso diário (via Firestore)
    routes/
      analyze.js                  # POST /analyze
    services/
      analyzeService.js           # Orquestra a chamada de IA
      aiService.js                # Fallback Groq → DeepSeek + retry
      usageService.js             # Contador diário no Firestore
    providers/
      groqProvider.js             # Cliente Groq (https nativo)
      deepseekProvider.js         # Cliente DeepSeek (https nativo)
    prompts/
      analyzePrompt.js            # System prompt centralizado
  .env.example                    # Variáveis de ambiente necessárias
  package.json
  test-local.js                   # Script de testes HTTP local
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

## Variáveis de ambiente

Crie o arquivo `functions/.env` com base no `.env.example`:

```env
GROQ_API_KEY=sua_chave_aqui
DEEPSEEK_API_KEY=sua_chave_aqui

# Limite diário de requisições (padrão: 200)
MAX_DAILY_REQUESTS=200
```

Onde obter as chaves:
- **Groq:** https://console.groq.com/keys (tem plano gratuito)
- **DeepSeek:** https://platform.deepseek.com/api_keys

> ⚠️ **DeepSeek requer saldo para funcionar.** Após criar a chave, adicione créditos em https://platform.deepseek.com/top_up — sem saldo, as chamadas retornam erro `"Insufficient Balance"`. O Groq funciona normalmente enquanto isso.

## Rodando localmente

```bash
# Emulador Firebase (recomendado para produção)
npm run serve

# Ou direto via Node (desenvolvimento rápido)
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

Recebe texto e/ou imagem para análise nutricional.

**Request**
```json
{
  "text": "Comi uma fatia de pizza e um copo de suco de laranja",
  "imageBase64": "<base64 opcional>"
}
```

Pelo menos um dos campos (`text` ou `imageBase64`) é obrigatório.

**Resposta de sucesso**
```json
{
  "success": true,
  "data": {
    "description": "fatia de pizza e suco de laranja",
    "carbs_estimate": 60,
    "confidence": 0.7
  }
}
```

**Header retornado em toda resposta:**
```
X-Daily-Usage: 47/200
```

**Resposta quando o limite diário é atingido (429)**
```json
{
  "success": false,
  "error": "Daily request limit reached. Try again tomorrow.",
  "usage": { "used": 200, "limit": 200 }
}
```

**Resposta de validação (400)**
```json
{
  "success": false,
  "error": "At least one of 'text' or 'imageBase64' is required"
}
```

---

## Fluxo de IA

```
POST /analyze
  → rateLimiter (checa limite diário no Firestore)
  → aiService
      → Groq (tentativa 1)
      → Groq (retry, se falhar)
      → DeepSeek (fallback, se Groq falhar)
      → DeepSeek (retry, se falhar)
      → erro 500 (se tudo falhar)
```

**Modelos utilizados:**
| Entrada | Provider | Modelo |
|---|---|---|
| Texto | Groq | llama-3.3-70b-versatile |
| Imagem | Groq | llama-3.2-11b-vision-preview |
| Fallback texto | DeepSeek | deepseek-chat (sem suporte a visão) |

## Limite diário de uso

O `rateLimiter` conta todas as requisições em `usage_daily/{YYYY-MM-DD}` no Firestore. O contador zera automaticamente a cada dia (UTC). O limite padrão é **200 req/dia** e pode ser ajustado via `MAX_DAILY_REQUESTS`.

Em desenvolvimento local sem emulador do Firestore, o limite é ignorado e as requisições passam normalmente.

## Deploy

```bash
firebase deploy --only functions
```

## Próximos passos

- [ ] Adicionar créditos ao DeepSeek para ativar o fallback
- [ ] Adicionar autenticação Firebase Auth
- [ ] Criar endpoints adicionais conforme necessidade do app
