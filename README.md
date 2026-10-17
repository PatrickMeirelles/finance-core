# finance-core

Backend (API) para um sistema de finanças pessoais, construído com **NestJS**, **TypeORM** e autenticação baseada em **JWT (access/refresh)**.

## Principais tecnologias

- **Node.js + TypeScript**
- **NestJS**
- **TypeORM**
- **Banco**:
  - **development**: SQLite (`better-sqlite3`) com arquivo local `database.sqlite`
  - **outros ambientes** (ex.: production): **Postgres**
- **Auth**: `Authorization: Bearer <accessToken>` via middleware global
- **E-mail**: Nodemailer com **conta de teste** (gera URL de preview no console)

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

- **NODE_ENV**: controla qual banco será usado
  - `development` → SQLite (`database.sqlite`)
  - qualquer outro valor → Postgres
- **PORT** (opcional): porta do servidor (padrão `3000`)
- **DB_HOST / DB_PORT / DB_USER / DB_PASS / DB_NAME**: apenas quando usar Postgres

> Importante: o projeto está configurado com `synchronize: true` no TypeORM. Isso cria/atualiza tabelas automaticamente ao subir a aplicação (útil para desenvolvimento, mas exige cuidado em produção).

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

- **Rodar em modo dev (watch)**:

```bash
pnpm start:dev
```

- **Build**:

```bash
pnpm build
```

- **Start “prod” (a partir de `dist/`)**:

```bash
pnpm start:prod
```

- **Testes**:

```bash
pnpm test
pnpm test:e2e
pnpm test:cov
```

- **Formatar código**:

```bash
pnpm format
```

- **Lint**:

```bash
pnpm lint
```

## Autenticação (como chamar endpoints protegidos)

Quase todas as rotas exigem header:

```text
Authorization: Bearer <accessToken>
```

Rotas **públicas** (não passam pelo middleware de auth):

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

CSV: a primeira linha é o cabeçalho e precisa ter uma coluna de data (`date`, `data`) e uma de valor (`amount`, `value`, `valor`); a coluna de descrição (`description`, `descricao`, `memo`, `historico`) é opcional. Separador `,`, `;` ou tab; datas `YYYY-MM-DD` ou `DD/MM/YYYY`; decimais com ponto ou vírgula. OFX: aceita SGML (1.x) e XML (2.x), lendo `DTPOSTED`, `TRNAMT`, `MEMO`/`NAME` e `FITID`.

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

O fluxo de “esqueci minha senha” envia um e-mail usando Nodemailer com **conta de teste**; ao disparar o envio, a aplicação imprime no console uma linha com:

- `Email preview: <url>`

Essa URL abre uma prévia do e-mail em ambiente de teste (sem precisar configurar SMTP real).

> Observação: o link de reset gerado hoje aponta para `http://localhost:3000/reset-password?token=...`

## Troubleshooting rápido

- **401 “Authorization header not provided”**: faltou mandar `Authorization: Bearer ...`.
- **“Invalid token”**: token expirou, foi revogado (logout) ou é de outro usuário/ambiente.
- **Postgres não conecta**:
  - confirme `docker compose ps`
  - confira `DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME` no `.env`
  - verifique se `NODE_ENV` não está `development` (senão ele usa SQLite)
