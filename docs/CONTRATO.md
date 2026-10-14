# Diagnóstico e contrato da API

Fonte: `README.md`, `src/routes.tsx`, `src/services`, `src/mock`, `src/types` e os 18 marcadores `TODO(backend)` do ZIP ProjetoFinal2.0. O ZIP não continha backend, Compose, `AGENTS.md` ou histórico Git. A API usa `/api/v1`; o alias `/admin/*` existe apenas na porta da API e exige SuperAdmin.

| Tela/arquivo | Ação | Endpoint | Entidade |
|---|---|---|---|
| `superadmin/Tenants.tsx` | criar/editar/suspender cliente, cobrar | `POST/PATCH /admin/tenants`, `PATCH /admin/tenants/{id}/status`, `POST /admin/invoices` | Tenant, User, BillingInvoice |
| `superadmin/Tenants.tsx` | gerenciar gerentes da loja | `GET/POST/PATCH /admin/tenants/{id}/managers`, `POST /admin/tenants/{id}/managers/{user_id}/reset-password` | User |
| `superadmin/Plans.tsx` | criar/editar/ativar plano | `POST /admin/plans`, `PATCH /admin/plans/{id}` | Plan |
| `superadmin/Invoices.tsx` | emitir/cancelar/reenviar/PDF | `POST /admin/invoices`, `POST /admin/invoices/{id}/cancel`, `/resend`, `GET /admin/invoices/{id}/pdf` | BillingInvoice, Payment |
| `superadmin/Reports.tsx` | CSV de clientes e boletos | `GET /admin/reports/export/{tenants,invoices}.csv` | Tenant, BillingInvoice |
| `superadmin/Settings.tsx` | ler/salvar configuração | `GET/PUT /admin/settings` | SystemSetting |
| `inicio/Contact.tsx` | enviar formulário | `POST /contact` | ContactMessage |
| `inicio/ForgotPassword.tsx` | iniciar recuperação | `POST /auth/forgot-password` | PasswordResetToken |
| `inicio/Signup.tsx` | criar loja/gerente | `POST /tenants` | Tenant, User |

Também fazem parte do contrato `POST /auth/login`, `/auth/refresh`, `/auth/reset-password`, `GET /auth/me`, `GET /plans`, `POST /subscriptions`, CRUD de categorias/produtos, `POST/GET /orders`, `POST /payments/pix`, status de pagamento, webhooks, notas fiscais e fila de cozinha.

## Campos consumidos pelo React

| Entidade | Campos do JSON |
|---|---|
| Tenant | `id`, `slug`, `name`, `cnpj`, `logoEmoji`, `ownerName`, `ownerEmail`, `ownerPhone`, `address`, `planId`, `cycle`, `status`, `totemCount`, `createdAt`, `contractEndsAt`, `lastLoginAt` |
| Plan | `id` UUID, `slug`, `name`, `description`, `priceMonthly`, `priceYearly`, `features`, `maxTotems`, `maxProducts`, `highlighted`, `active`, `sortOrder` |
| BillingInvoice | `id`, `number`, `tenantId`, `tenantName`, `tenantSlug`, `planId`, `planName`, `amount`, `status`, `issuedAt`, `dueAt`, `paidAt`, `boletoUrl`, `barcode`, `pixQrImage`, `pixCopyPaste`, `notes` |
| Category/Product | `id`, `name`, `icon`, `order`; `price`, `imageUrl`, `categoryId`, `available`, `ingredients`, `additions`, `allergens`, `ncm`, `cfop` |
| Order | `id`, `code`, `status`, `items`, `subtotal`, `total`, `createdAt`, `totemId`, `customer` |
| User | `id`, `name`, `email`, `role`, `tenantId`, `active` |
| Settings | `sendInvoiceEmail`, `autoSuspend`, `autoSuspendDays`, `welcomeMessage`, `supportEmail`, `maintenanceMode` |

Persistem também RefreshToken, Subscription, Payment, FiscalInvoice, WebhookEvent, AuditLog, PasswordResetToken, ContactMessage e EmailDelivery. IDs de tabelas são UUID. `tenant_id` é obrigatório em dados de loja/cobrança; Plan, Tenant, SuperAdmin e configuração global não pertencem a um tenant. Rotas normais resolvem o tenant exclusivamente pelo JWT. Rotas SuperAdmin recebem tenant explícito no caminho ou no corpo de criação da cobrança.

## Suposições e conflitos resolvidos

- O README antigo usa `/api` e `X-Tenant`; o contrato novo é `/api/v1` e ignora `X-Tenant` para autorização.
- IDs como `t-001` e `basic` nos mocks não são IDs persistidos. Todos os IDs persistidos são UUID; `slug` mantém URLs amigáveis.
- A senha de gerente não pode ser inferida da tela de criação de cliente; o backend gera um convite de definição de senha enviado por email. No modo de desenvolvimento sem SMTP, o email é escrito nos logs da API.
- Boleto exige CPF/CNPJ e, no Mercado Pago, endereço completo do pagador. A API rejeita emissão sem os campos necessários; não inventa dados fiscais.
- Checkout público inicia 14 dias de teste e cria Subscription. As opções de pagamento exibidas no layout são informativas até o fim do teste; a cobrança posterior é emitida no console.
- Nota fiscal de venda ao consumidor usa NFC-e modelo 65. NCM/CFOP e credenciais fiscais são exigidos antes da emissão real.
- Email em desenvolvimento usa logs da API quando SMTP não está configurado; produção usa SMTP configurado por variáveis de ambiente.

O OpenAPI gerado em `/openapi.json` é o contrato executável; `/docs` exibe o Swagger.
