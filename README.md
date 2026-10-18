# finance-core

Backend (API) para um sistema de finanças pessoais, construído com **NestJS**, **TypeORM** e autenticação baseada em **JWT (access/refresh)**.

## Principais tecnologias

- **Node.js + TypeScript**
- **NestJS**
- **TypeORM**
- **Banco**:
  - **development**: SQLite (`better-sqlite3`) com arquivo local `database.sqlite`
  - **outros ambientes** (ex.: production): **Postgres**
- **Auth**: `Authorization: Bearer <accessToken>` via middleware global (JWT assinado + sessão no banco)
- **E-mail**: Nodemailer via SMTP configurado por variáveis de ambiente (em `development` sem SMTP, usa conta de teste com URL de preview no console)
- **Hospedagem**: processo Node tradicional (`pnpm start:prod`) ou função serverless na Vercel (`api/index.js`)

## Pré-requisitos

- **Node.js** (recomendado: versão LTS recente)
- **pnpm**
- (Opcional) **Docker + Docker Compose** (se for usar Postgres localmente)

## Configuração de ambiente

Existe um exemplo em `.env.example`. Para rodar localmente:

```bash
cp .env.example .env
```

### Variáveis suportadas

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `NODE_ENV` | sim | `development` usa SQLite local com schema sincronizado; qualquer outro valor usa Postgres com migrations |
| `PORT` | não | porta do servidor (padrão `3000`) |
| `JWT_SECRET` | fora de `development` | segredo de assinatura dos tokens; gere com `openssl rand -base64 48`. Sem ele a API não sobe |
| `DATABASE_URL` | Postgres | URL completa (Neon, Supabase, Render). Quando presente, SSL é ligado |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_SSL` | Postgres | alternativa à `DATABASE_URL` |
| `CORS_ORIGINS` | não | origens permitidas separadas por vírgula; vazio ou `*` libera qualquer origem (apps nativos não precisam de CORS) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | fora de `development` | servidor SMTP do e-mail de redefinição de senha |
| `PASSWORD_RESET_URL` | não | se definida, o e-mail inclui um botão para `<URL>?token=...`; o código em texto vai sempre |

> O schema do Postgres é gerenciado por **migrations** (`src/migrations`), aplicadas automaticamente quando a API sobe (`migrationsRun: true`). `synchronize` fica ligado apenas no SQLite de desenvolvimento.

## Como rodar localmente

### Opção A (mais simples): SQLite (development)

1. Ajuste o `.env`:

```bash
NODE_ENV=development
```

2. Instale dependências e rode:

```bash
pnpm install
pnpm start:dev
```

- O arquivo `database.sqlite` será criado na raiz do projeto.
- Em `development` as colunas enum usam `simple-enum` (SQLite não tem enum nativo) e as consultas não pedem lock de linha; nos outros ambientes nada muda.
- API disponível em `http://localhost:3000`.

### Opção B: Postgres via Docker (modo “production” do banco)

1. Suba o Postgres:

```bash
docker compose up -d
```

2. Ajuste o `.env` (você pode usar o `.env.example` como base). Exemplo:

```bash
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_USER=finance
DB_PASS=finance
DB_NAME=finance
```

3. Instale dependências e rode:

```bash
pnpm install
pnpm start:dev
```

## Scripts úteis

| Comando | O que faz |
| --- | --- |
| `pnpm start:dev` | modo dev com watch (SQLite) |
| `pnpm build` | compila para `dist/` |
| `pnpm start:prod` | sobe a partir de `dist/` |
| `pnpm test`, `pnpm test:e2e`, `pnpm test:cov` | testes |
| `pnpm lint`, `pnpm format` | lint e formatação |
| `pnpm migration:generate src/migrations/<Nome>` | gera uma migration comparando as entidades com o banco apontado pelas variáveis `DATABASE_URL`/`DB_*` |
| `pnpm migration:run` / `pnpm migration:revert` | aplica ou desfaz migrations manualmente (a API também aplica ao subir) |

## Segurança

Medidas ativas na API (todas cobertas por testes unitários):

- **Dono dos dados**: toda leitura, alteração e exclusão de contas, categorias e transações é filtrada pelo usuário da sessão. Um id de outro usuário responde como inexistente.
- **Tokens**: access e refresh são JWTs assinados com `JWT_SECRET` e com `jti` único; o banco guarda apenas o SHA-256 de cada um. Refresh rotaciona a sessão e invalida o par anterior; logout e troca de senha encerram todas as sessões.
- **Senha**: hash bcrypt (`bcryptjs`), nunca retornada (`select: false`), política forte no cadastro e na redefinição.
- **Redefinição de senha**: resposta neutra (não revela se o e-mail existe), token aleatório de 256 bits guardado como hash, validade de 15 minutos, uso único.
- **Rate limiting**: 120 requisições/minuto por IP no geral e 10/minuto nas rotas de credenciais (`register`, `login`, `refresh`, `forgot-password`, `reset-password`). Responde `429`.
- **Validação**: `ValidationPipe` com `whitelist` (campos desconhecidos são descartados), paginação limitada a 100 itens, enums e ordenação restritos a valores conhecidos, upload limitado a 5 MB.
- **Cabeçalhos**: Helmet; CORS configurável por `CORS_ORIGINS`.
- **Rota pública de saúde**: `GET /health`.

## Deploy gratuito: Vercel + Neon

1. **Banco (Neon)**: crie um projeto Postgres gratuito e um **banco dedicado** para a API (`neonctl databases create --name xpen6 ...`). A migration inicial cria todas as tabelas e falha se o banco já tiver uma tabela `users` de outro uso. Copie a connection string (`postgresql://...sslmode=require`).
2. **API (Vercel)**: no diretório do projeto, `npx vercel link` e depois configure as variáveis no projeto (`vercel env add` ou painel): `NODE_ENV=production`, `JWT_SECRET`, `DATABASE_URL`, `SMTP_*`, `MAIL_FROM`, opcionalmente `CORS_ORIGINS` e `PASSWORD_RESET_URL`. Defina também `NODEJS_HELPERS=0` para que o corpo das requisições (JSON e multipart) chegue intacto ao Express.
3. `npx vercel --prod`. O `vercel.json` roda `pnpm build` e expõe `api/index.js`, que inicializa o NestJS uma vez por instância (`src/serverless.ts`). As migrations são aplicadas no primeiro boot.
4. Desative a **Deployment Protection** do projeto (Settings > Deployment Protection, ou `PATCH /v9/projects/<id>` com `ssoProtection: null`); por padrão a Vercel exige login para acessar deployments novos, o que bloquearia o app.
5. Teste: `curl https://<projeto>.vercel.app/health`.

Instância atual: <https://finance-core-lyart.vercel.app> (projeto `finance-core` na Vercel, banco `xpen6` no Neon).

Limites do plano gratuito que importam aqui: funções com até 30 s de execução (configurado em `vercel.json`) e corpo de requisição de 4,5 MB (o limite de upload do extrato é 5 MB; arquivos acima de 4,5 MB falham na Vercel). O throttling é por instância, portanto é um limite aproximado nesse modelo; para algo mais rígido use o WAF/rate limit da própria Vercel.

## Autenticação (como chamar endpoints protegidos)

Quase todas as rotas exigem header:

```text
Authorization: Bearer <accessToken>
```

Rotas **públicas** (não passam pelo middleware de auth):

- `GET /` e `GET /health`
- `POST /users/register`
- `POST /users/login`
- `POST /users/forgot-password`
- `POST /users/reset-password`
- `POST /users/refresh` (recebe `{ "refreshToken" }` no body e devolve um novo par de tokens)

## Rotas principais

### Usuários

- `POST /users/register`
- `POST /users/login`
- `POST /users/refresh`
- `GET /users/me`
- `PATCH /users/update`
- `POST /users/logout`
- `POST /users/forgot-password`
- `POST /users/reset-password`

### Contas

- `POST /accounts/create`
- `GET /accounts`
- `GET /accounts/:id`
- `PATCH /accounts/update/:id`
- `DELETE /accounts/:id`

### Categorias

- `POST /categories/create`
- `GET /categories`
- `GET /categories/:id`
- `PATCH /categories/update/:id`
- `DELETE /categories/:id`

### Transações

- `POST /transactions/create`
- `GET /transactions` (aceita filtros via querystring; ver DTO `GetTransactionsDto`)
- `GET /transactions/insights?months=6` (série mensal, totais do período, mês atual vs anterior e gastos por categoria)
- `POST /transactions/import` (importa extrato CSV ou OFX; multipart)
- `GET /transactions/:id`
- `PATCH /transactions/:id`
- `DELETE /transactions/:installmentsGroupId`

> Valores monetários (`value`, `income`, `expense`, `balance`) são sempre **inteiros em centavos**. Ex.: R$ 12,34 => `1234`.

#### Importação de extrato (`POST /transactions/import`)

Campos do `multipart/form-data`:

- `file`: arquivo `.csv` ou `.ofx` (máx. 5 MB)
- `accountId`: conta que receberá os lançamentos
- `expenseCategoryId`: categoria (tipo `expensive`) usada nos valores negativos
- `incomeCategoryId`: categoria (tipo `income`) usada nos valores positivos

CSV: a primeira linha é o cabeçalho (unidades entre parênteses são ignoradas, ex.: `Valor (R$)`) e precisa ter uma coluna de data (`date`, `data`, `data lançamento`) e o valor em um destes formatos:

- uma coluna de valor (`amount`, `value`, `valor`, `quantia`) com sinal: `-50,00`, `50,00-`, `(50,00)`, `−50,00` ou com marcador `D`/`C` (`50,00 D`, `C 2.000,00`) são aceitos; `+` ou sem sinal é entrada;
- ou uma coluna de valor sem sinal mais uma coluna de tipo (`tipo`, `type`, `d/c`, `natureza`) com `D`/`Débito`/`Saída` para saída e `C`/`Crédito`/`Entrada` para entrada;
- ou duas colunas, `débito`/`saída` e `crédito`/`entrada`.

A coluna de descrição (`description`, `descricao`, `memo`, `historico`, `lançamento`) é opcional. Separador `,`, `;` ou tab; datas `YYYY-MM-DD` ou `DD/MM/YYYY`; decimais com ponto ou vírgula; `R$`/`BRL` são ignorados. OFX: aceita SGML (1.x) e XML (2.x), lendo `DTPOSTED`, `TRNAMT`, `TRNTYPE` (decide a direção quando o banco exporta valores sem sinal), `MEMO`/`NAME` e `FITID`.

Exemplo:

```bash
curl -X POST http://localhost:3000/transactions/import \
  -H "Authorization: Bearer <accessToken>" \
  -F file=@extrato.csv -F accountId=1 -F expenseCategoryId=1 -F incomeCategoryId=2
```

Resposta: `{ imported, skipped, transactions }`.

#### Insights (`GET /transactions/insights?months=6`)

Retorna `period`, `totals` (período), `previousPeriod`, `currentMonth`, `previousMonth`, `monthly[]` (`month` no formato `YYYY-MM`) e `byCategory[]` (gastos do mês atual por categoria). `months` vai de 1 a 24 (padrão 6).

## E-mail (reset de senha)

`POST /users/forgot-password` responde sempre `200` com a mesma mensagem e, quando o e-mail existe, envia uma mensagem com o **código** de redefinição (64 caracteres hexadecimais, válido por 15 minutos) e, se `PASSWORD_RESET_URL` estiver definida, um botão para `<URL>?token=<código>`. O código é usado em `POST /users/reset-password` com `{ "token", "password" }`.

- Em `development` sem `SMTP_HOST`, a API usa uma conta de teste do Nodemailer e imprime `Email preview: <url>` no console.
- Fora de `development`, `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` são obrigatórios. Sem eles o envio falha, o erro vai para o log e a resposta continua neutra (o cliente não descobre se o e-mail existe). Provedores com plano gratuito e SMTP: Brevo, Resend, Mailtrap.

## Troubleshooting rápido

- **401 “Authorization header not provided”**: faltou mandar `Authorization: Bearer ...`.
- **401 “Invalid token”**: token expirou, foi revogado (logout, refresh ou troca de senha), foi assinado com outro `JWT_SECRET` ou é um refresh token usado como access token. Use `POST /users/refresh`.
- **429 “ThrottlerException”**: limite de requisições por minuto atingido; aguarde e tente de novo.
- **A API não sobe com “JWT_SECRET must be set”**: defina a variável (só `development` tem fallback).
- **Vercel responde 500 no boot**: confira `DATABASE_URL` (precisa de `sslmode=require`) e veja os logs com `vercel logs`.
- **Postgres não conecta**:
  - confirme `docker compose ps`
  - confira `DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME` no `.env`
  - verifique se `NODE_ENV` não está `development` (senão ele usa SQLite)
