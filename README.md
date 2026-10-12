# Camada SaaS · Início + Totem + Admin + Superadmin

Esta branch adiciona a camada visual completa do FastLanches como SaaS multi-tenant: site institucional para vender o produto, totem do cliente reorganizado sob `/totem/*`, painel administrativo de cada loja e console interno do time FastLanches.

Nada aqui depende do backend. Tudo funciona com dados mockados e alterna para API real trocando uma variável de ambiente.

---

## O que mudou nesta branch

### 1 · Nova camada: site institucional

Antes da branch existir, o projeto era só o totem. Agora existe uma raiz `/` com a página de venda do produto, planos, cadastro de loja, login e checkout.

**Páginas adicionadas:**

| Rota | O que é |
|---|---|
| `/` | Landing institucional — hero, benefícios, números, como funciona, planos |
| `/planos` | Comparativo detalhado dos planos, FAQ |
| `/cadastro` | Formulário de criação de conta de loja |
| `/entrar` | Login para lojistas existentes |
| `/checkout/:planoId` | Finalizar contratação do plano |

**Componentes adicionados em `src/components/inicio/`:**
- `PlanCard` — card de plano com destaque opcional

**Layout adicionado em `src/layouts/`:**
- `InicioLayout.tsx` — header com navegação, footer com 4 colunas

### 2 · Nova camada: console do superadmin

Área interna do time FastLanches para operar o SaaS. Paleta própria em índigo, separada visualmente do admin da loja.

**Páginas adicionadas:**

| Rota | O que é |
|---|---|
| `/superadmin/login` | Login do console |
| `/superadmin` | Visão geral (clientes ativos, MRR, alertas, boletos vencidos) |
| `/superadmin/clientes` | Lista de lojas com filtro por status, busca, expansão |
| `/superadmin/boletos` | Controle de faturas, filtro por status, alerta de inadimplência |
| `/superadmin/planos` | Listagem dos planos vendidos |
| `/superadmin/relatorios` | Relatórios financeiros por plano |
| `/superadmin/configuracoes` | Regras de cobrança e suspensão automática |

**Componentes adicionados em `src/components/superadmin/`:**
- `TenantStatusBadge` — badge colorido por status de cliente (trial, active, past_due, suspended, cancelled)
- `InvoiceStatusBadge` — badge por status de boleto (pending, paid, overdue, cancelled, refunded)

**Layout adicionado em `src/layouts/`:**
- `SuperAdminLayout.tsx` — sidebar escura com índice de menu

### 3 · Totem reorganizado sob `/totem/*`

As rotas do totem saíram da raiz e foram agrupadas sob `/totem/`. Isso liberou `/` para o site institucional.

| Antes | Agora |
|---|---|
| `/splash` | `/totem/splash` |
| `/welcome` | `/totem/welcome` |
| `/menu` | `/totem/menu` |
| `/product/:id` | `/totem/product/:id` |
| `/cart` | `/totem/cart` |
| `/payment` | `/totem/payment` |
| `/payment/pix` | `/totem/payment/pix` |
| `/order/confirmed` | `/totem/order/confirmed` |
| `/error/*` | `/totem/error/*` |

**Nenhum componente do totem foi alterado** — só os caminhos. Toda a UI, lógica e comportamento continuam iguais.

### 4 · Novos tipos

Adicionados em `src/types/`:

- `tenant.ts` — Tenant, TenantStatus, SubscriptionCycle, TenantAddress
- `plan.ts` — Plan com features, preços mensal/anual, limites
- `invoice.ts` — Invoice, InvoiceStatus

### 5 · Novos mocks

Adicionados em `src/mock/`:

- `plans.ts` — 3 planos (Básico, Pro, Enterprise)
- `tenants.ts` — 6 lojas cliente em diferentes status
- `invoices.ts` — 8 boletos de exemplo

### 6 · Novos services

Adicionados em `src/services/`:

- `tenants.ts` — listar, buscar por slug, criar, atualizar status
- `plans.ts` — listar, buscar por id
- `invoices.ts` — listar, buscar por id, criar

Todos seguem o mesmo padrão dos existentes: checam `ENV.useMocks` antes de decidir entre retornar mock ou chamar a API.

### 7 · Novos contexts

- `SuperAdminContext.tsx` — sessão do console interno, com persist em `fastlanches.superauth`

### 8 · Novos hooks

- `useTenants.ts`
- `usePlans.ts`
- `useInvoices.ts`

### 9 · Tokens adicionados

Em `src/styles/tokens.css`, um bloco novo no final:

```css
--color-super-primary:       #6366F1;
--color-super-primary-hover: #4F46E5;
--color-super-dark:          #312E81;
--color-super-soft:          #E0E7FF;
--color-super-bg:            #F8FAFC;
--color-super-sidebar:       #0F172A;
--gradient-super: linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #4F46E5 100%);
--shadow-super: 0 10px 24px rgba(99, 102, 241, 0.30);
```

### 10 · Ajustes pontuais

- `Text` ganhou o tom `'success'` no union type `TextTone` e a classe `.text--success`
- `ToggleSwitch` foi exportado no barrel `@/components/ui`
- `routes.tsx` foi reescrito para incluir as 4 camadas
- O import morto de `AdminLogin` foi removido (a rota `/admin/login` agora redireciona para `/entrar`)

---

## Como testar esta branch

```bash
git checkout <nome-da-branch>
npm install
cp .env.example .env
npm run dev
```

Abre `http://localhost:5173`.

**Verificação rápida (5 minutos):**

1. **Início funciona:** acessa `/` e confere se a landing carrega com hero, benefícios e planos
2. **Planos funciona:** acessa `/planos`, alterna entre Mensal e Anual, confere preços atualizados
3. **Cadastro funciona:** acessa `/cadastro`, preenche os campos, avança para checkout
4. **Totem funciona:** acessa `/totem/welcome`, navega pelo cardápio até o Pix
5. **Admin da loja funciona:** acessa `/admin`, qualquer email/senha entra
6. **Superadmin funciona:** acessa `/superadmin/login`, credenciais `admin@fastlanches.com` / `super123`

**Verificar que o build passa:**

```bash
npm run build
```

Sem erros de TypeScript. Sem warnings de import morto.

---

## Contratos esperados do backend

Para o dia que o backend entrar, cada service já tem a interface definida. Segue a lista do que precisa ser implementado.

### Rotas para o site institucional e cadastro

```
POST   /api/tenants                     → Tenant      (cadastro público)
GET    /api/plans                       → Plan[]
GET    /api/plans/:id                   → Plan
POST   /api/subscriptions               → Subscription (contratação)
```

### Rotas para o superadmin

```
GET    /api/tenants                     → Tenant[]    (todos os clientes)
GET    /api/tenants/:slug               → Tenant
PATCH  /api/tenants/:id/status          → Tenant      (suspender, ativar, cancelar)
GET    /api/invoices                    → Invoice[]
GET    /api/invoices/:id                → Invoice
POST   /api/invoices                    → Invoice     (emitir boleto)
POST   /api/invoices/:id/cancel         → Invoice
POST   /api/invoices/:id/resend         → { ok: true }
GET    /api/reports/revenue             → { mrr, churn, newTenants }
```

### Header de tenant nas requisições

Toda requisição para `/api/tenants` no contexto de superadmin **não precisa** de `X-Tenant` — o superadmin opera entre lojas. Mas requisições para o admin da loja **precisam** do header, e o interceptor já injeta automaticamente lendo de `localStorage.fastlanches.tenant`.

---

## O que ficou de fora desta branch

Coisas que já existem ou que ficam para depois:

- **Backend**: não faz parte desta branch. A pasta `backend/` foi removida no começo da reorganização porque o escopo aqui é apenas a camada visual.
- **Integração real com Mercado Pago**: `PaymentPix` continua com `PAYMENT_AUTO_ADVANCE_MS = 5000` (auto-avanço de teste). Em produção, deve ser `null` e ativado o polling real.
- **Autenticação real**: o login do superadmin e do admin da loja ainda são mocks — qualquer credencial entra.
- **Impressão na cozinha**: prevista mas não implementada.
- **Emissão fiscal (NFC-e)**: prevista mas não implementada.
- **Testes automatizados**: não fazem parte desta branch.

---

## Estrutura final das pastas

Só o que é novo ou movido nesta branch:

```
src/
├── components/
│   ├── inicio/                       ← NOVO
│   │   ├── PlanCard.tsx
│   │   └── PlanCard.css
│   │
│   └── superadmin/                   ← NOVO
│       ├── TenantStatusBadge.tsx
│       ├── TenantStatusBadge.css
│       ├── InvoiceStatusBadge.tsx
│       └── InvoiceStatusBadge.css
│
├── contexts/
│   └── SuperAdminContext.tsx         ← NOVO
│
├── hooks/
│   ├── useTenants.ts                 ← NOVO
│   ├── usePlans.ts                   ← NOVO
│   └── useInvoices.ts                ← NOVO
│
├── layouts/
│   ├── InicioLayout.tsx              ← NOVO (substitui MarketingLayout)
│   ├── InicioLayout.css              ← NOVO
│   ├── SuperAdminLayout.tsx          ← NOVO
│   └── SuperAdminLayout.css          ← NOVO
│
├── mock/
│   ├── plans.ts                      ← NOVO
│   ├── tenants.ts                    ← NOVO
│   └── invoices.ts                   ← NOVO
│
├── pages/
│   ├── inicio/                       ← NOVO (substitui marketing/)
│   │   ├── Home.tsx
│   │   ├── Home.css
│   │   ├── Plans.tsx
│   │   ├── Plans.css
│   │   ├── Signup.tsx
│   │   ├── Signup.css
│   │   ├── Login.tsx
│   │   ├── Checkout.tsx
│   │   └── Checkout.css
│   │
│   ├── superadmin/                   ← NOVO
│   │   ├── Login.tsx
│   │   ├── Overview.tsx
│   │   ├── Overview.css
│   │   ├── Tenants.tsx
│   │   ├── Tenants.css
│   │   ├── Invoices.tsx
│   │   ├── Invoices.css
│   │   ├── Plans.tsx
│   │   ├── PlansAdmin.css
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   │
│   └── totem/                        ← ROTAS MOVIDAS para /totem/*
│
├── services/
│   ├── tenants.ts                    ← NOVO
│   ├── plans.ts                      ← NOVO
│   └── invoices.ts                   ← NOVO
│
├── styles/
│   └── tokens.css                    ← MODIFICADO (tokens superadmin)
│
└── types/
    ├── tenant.ts                     ← NOVO
    ├── plan.ts                       ← NOVO
    ├── invoice.ts                    ← NOVO
    └── index.ts                      ← MODIFICADO (reexporta os 3 novos)
```

---

## Checklist para o PR

Antes de abrir o pull request:

- [ ] `npm run build` passa sem erro
- [ ] `npm run typecheck` passa sem erro
- [ ] Landing (`/`) carrega
- [ ] Planos (`/planos`) carrega
- [ ] Cadastro (`/cadastro`) carrega
- [ ] Totem (`/totem/welcome`) navega até o Pix
- [ ] Admin da loja (`/admin`) abre após login mock
- [ ] Superadmin (`/superadmin`) abre após login com `admin@fastlanches.com` / `super123`
- [ ] Nenhuma referência a "marketing" sobrou no código (busca por `marketing` retorna zero em `src/`)

Verificação rápida da última:

```bash
grep -r "marketing" src/ || echo "nenhuma referência restante"
```

---

## Resumo para o commit

> Adiciona a camada SaaS completa com quatro camadas de navegação:
> site institucional em `/`, totem reorganizado sob `/totem/*`, painel
> administrativo de loja em `/admin/*` e console interno em `/superadmin/*`.
>
> Inclui tipos, mocks, services, hooks, contexts, layouts e páginas para
> cada camada. Toda a UI roda com mocks e alterna para API real trocando
> `VITE_USE_MOCKS` no `.env`.
>
> Rotas do totem foram movidas de `/` para `/totem/` para liberar a raiz
> para o site institucional. Nenhum componente do totem foi alterado.
