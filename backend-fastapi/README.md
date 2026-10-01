# FastLanches API

Backend FastAPI para o totem e painel administrativo do FastLanches. Usa PostgreSQL, SQLAlchemy assíncrono, Alembic, JWT, isolamento multi-tenant por estabelecimento e cobrança exclusivamente Pix no Mercado Pago.

O seed replica os registros de `src/mock/menu.ts`. O arquivo contém **26 produtos** (apesar do texto do projeto mencionar 25) e cinco categorias.

## Iniciar localmente

1. Copie `.env.example` para `.env` e altere `JWT_SECRET`, `POSTGRES_PASSWORD` e a senha inicial do admin.
2. Execute `docker compose up --build -d`.
3. Crie o tenant e o primeiro admin: `docker compose exec api python -m app.seed`.
4. Abra `http://localhost:8000/docs` (OpenAPI) ou `http://localhost:8000/redoc`.

O container aplica as migrations Alembic antes de iniciar o servidor. Para parar: `docker compose down`. Para também apagar o banco local: `docker compose down -v`.

## Testes automatizados

Execute `python -m pytest -q`. A suíte cobre health check, contrato OpenAPI, serialização do catálogo, pedido e recálculo server-side, CPF e assinatura do webhook. Os testes de API substituem a sessão por uma sessão simulada; para validar migração/conexão PostgreSQL execute `docker compose up --build -d` e para validar cobrança real configure credenciais Mercado Pago de teste e webhook público.

## Tenant e autenticação

Todas as rotas `/api/v1` precisam de `X-Tenant: <slug>` (se omitido, usa `DEFAULT_TENANT_SLUG`). Os dados de cada restaurante levam `tenant_id`; as consultas verificam esse identificador. O admin usa `Authorization: Bearer <JWT>`. Faça login em `POST /api/v1/auth/login`. O token tem duração configurável em `JWT_EXPIRE_MINUTES`.

Para cadastrar outro estabelecimento, crie uma linha em `tenants` e ao menos um usuário com hash Argon2. Não exponha uma rota pública de criação de tenants/admins. Use HTTPS, segredo JWT forte, backup do PostgreSQL e gestão segura de secrets em produção.

## Contratos HTTP

JSON UTF-8; dinheiro é decimal em reais, com duas casas. Datas são ISO-8601 com fuso. IDs são UUID. `GET /health` é o health check.

| Método e rota | Acesso | Uso |
|---|---|---|
| `POST /api/v1/auth/login` | Público no tenant | `{ "email": "gerente@loja.com", "password": "..." }` → `{ "access_token": "...", "token_type": "bearer" }` |
| `GET /api/v1/categories` | Totem | Lista categorias ativas ordenadas por `sort_order`, `name` |
| `POST /api/v1/categories` | Admin | Cria `{name, icon, sort_order, active}` |
| `PUT /api/v1/categories/{id}` | Admin | Substitui campos da categoria |
| `DELETE /api/v1/categories/{id}` | Admin | Desativa (soft delete); retorna 204 |
| `GET /api/v1/products?category_id=&available=` | Totem | Produtos ativos, filtros opcionais |
| `GET /api/v1/products/{id}` | Totem | Um produto ativo |
| `POST /api/v1/products` | Admin | Cria produto; preço maior que zero e categoria do mesmo tenant |
| `PUT /api/v1/products/{id}` | Admin | Atualiza produto |
| `DELETE /api/v1/products/{id}` | Admin | Desativa; retorna 204 |
| `POST /api/v1/orders` | Totem | Cria pedido. Requer `Idempotency-Key` único (8–100 chars). |
| `GET /api/v1/orders/{id}` | Totem | Consulta pedido do tenant |
| `GET /api/v1/orders?status=&limit=&offset=` | Admin | Lista pedidos; status opcional, paginação |
| `PATCH /api/v1/orders/{id}/status` | Admin | `{ "status": "preparing" }`; valores: paid, preparing, ready, completed, cancelled |
| `POST /api/v1/payments/pix` | Totem | Corpo `{ "orderId": "uuid", "amount": 10.0 }`; cria cobrança Pix. `amount` é ignorado e vem do pedido. |
| `GET /api/v1/payments/pix/{order_id}` | Totem | Consulta status: pending, approved, rejected, cancelled, expired |
| `POST /api/v1/webhooks/mercadopago` | Mercado Pago | Valida `x-signature`, consulta o pagamento na API MP e atualiza estado |
| `POST /api/v1/orders/{id}/invoice` | Totem | Solicita emissão/envio fiscal após pagamento e se email foi informado |
| `GET /api/v1/orders/{id}/invoice` | Totem | Consulta estado e links da nota |
| `GET /api/v1/reports/daily` | Admin | Vendas pagas, número de pedidos, ticket médio, participação Pix |
| `GET /api/v1/reports/top-products?limit=5` | Admin | Mais vendidos por quantidade |
| `GET /api/v1/reports/summary?start={ISO}&end={ISO}` | Admin | Faturamento e pagamentos no intervalo semiaberto `[start,end)` |

### Criar pedido

```http
POST /api/v1/orders
X-Tenant: demo
Idempotency-Key: 03f1ca89-2dfd-4d6c-9a85-8724b823f143
Content-Type: application/json
```

```json
{
  "items": [{"product_id":"00000000-0000-0000-0000-000000000001","quantity":2,"removed_ingredients":["cebola"],"additions":[],"notes":"bem passado"}],
  "cpf":"529.982.247-25", "invoice_email":"cliente@example.com", "kiosk_id":"totem-01"
}
```

Backend calcula o total usando preços atuais no banco; valores enviados pelo cliente não existem no contrato. Repetir a mesma chave no mesmo tenant retorna o pedido original (200) sem duplicá-lo. Guarde a chave durante retries de rede. Pedido retorna `id`, `code` de retirada, `status`, `total`, `created_at` e linhas com snapshot do nome/preço.

## Mercado Pago Pix

Configure `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` e `MERCADOPAGO_WEBHOOK_URL` com credenciais de teste antes de produção. Backend cria payment Pix (expiração de 30 minutos), usa idempotência do MP, persiste QR e inicia como `pending`. O frontend deve consultar `GET /payments/pix/{order_id}` a cada poucos segundos; não avance a tela por temporizador nem aceite confirmação do cliente.

Cadastre a URL pública do webhook no painel Mercado Pago. Cada notificação é autenticada pelo HMAC SHA-256 do formato oficial (`data.id`, `x-request-id`, `ts`); o backend consulta a API autenticada do MP antes de confiar no status. Eventos repetidos são seguros; `approved` nunca regride para estado pendente. Configure HTTPS e não exponha secrets no frontend. Para operação robusta, use fila com retries/DLQ para processamento de webhook e emissão fiscal; a chamada HTTP síncrona atual não é substituta de worker.

## Fiscal (NFC-e)

CPF e email continuam opcionais no pedido. A rota de invoice só é chamada quando o cliente optou por receber email. NFC-e depende de CNPJ/IE, certificado digital, CSC, UF, regime tributário, NCM/CFOP, regras de tributação e ambiente/credenciamento da SEFAZ, além de um integrador fiscal. Configure provedor credenciado e implemente seu adaptador antes de produção. O modo inicial `FISCAL_PROVIDER=mock` registra o pedido e informa status `failed` com motivo configurável: ele **não emite documento fiscal**. A API só retorna `issued`, chave de acesso e links após confirmação real do provedor. O email/link de distribuição também depende do contrato do integrador.

## Multi-tenant

Modelo compartilhado por schema com `tenant_id`, composto de índices e unicidade onde necessário. Envie `X-Tenant` em toda requisição e nunca derive tenant de um campo do corpo. Usuários, produtos, categorias, pedidos, linhas, cobranças e documentos fiscais são escopados. Para defesa em profundidade em instalações maiores, considere Row-Level Security no PostgreSQL e `SET LOCAL app.tenant_id` por transação. O slug do tenant é identificador público, não segredo.

## Erros

Erros FastAPI seguem `{ "detail": "mensagem" }`; validação Pydantic (422) pode devolver uma lista com `loc`, `msg`, `type`. Algumas respostas incluem `X-Error-Code` estável. Frontend deve tratar HTTP, não texto localizado, como fonte da categoria.

| HTTP | Quando |
|---|---|
| 400 | Request malformado (FastAPI pode responder 422 em validação de campos) |
| 401 | Credencial inválida, token ausente/inválido ou assinatura de webhook inválida |
| 404 | Tenant, recurso ou cobrança inexistente no escopo do tenant |
| 409 | Produto indisponível, pedido aguardando pagamento ou conflito de estado |
| 422 | Campo inválido, CPF inválido, categoria de outro tenant, intervalo incorreto |
| 500 | Falha inesperada; resposta padrão do FastAPI, sem stack trace em produção |
| 502 | Mercado Pago rejeitou ou falhou ao criar cobrança |
| 503 | Integração de pagamento não configurada |

Mapeamentos relevantes: `invalid_cpf`, `product_unavailable`, `payment_provider_unavailable`, `payment_provider_error`, `invoice_email_required`, `order_not_paid`. Erro de conexão e timeout não devem ser mostrados como pagamento recusado; o frontend deve manter pedido e consultar novamente. Configure logs estruturados, request ID, alertas e ocultação de CPF/email/token.

## Integração do frontend

Base URL local: `http://localhost:8000/api/v1`; defina `VITE_API_URL=http://localhost:8000/api/v1` e `VITE_USE_MOCKS=false`. O cliente precisa anexar `X-Tenant`; o interceptor admin anexa JWT. IDs de catálogo mantêm os identificadores existentes (`c1`, `b1`, etc.) para não quebrar o carrinho persistido. Categorias respondem `{id,name,icon,order}`; produtos usam os campos camelCase do frontend, incluindo `categoryId`, `imageUrl`, `ingredients`, `additions`, `allergens`. O pedido aceita o `CartItem` atual e devolve `subtotal`, `total`, `totemId`, `customer` e linhas compatíveis. Pix responde `{orderId,qrCodeImage,copyPaste,amount}`.

O serviço frontend de pedido deve mandar um `Idempotency-Key` (UUID novo por intenção de pedido e reutilizado em retentativas). Para evitar duplicação causada pela montagem repetida do componente React em modo Strict, persista essa chave enquanto o mesmo carrinho está sendo enviado e descarte-a quando começar uma nova compra. O serviço de pagamentos existente envia `{orderId, amount}`; `amount` é aceito por compatibilidade e ignorado no cálculo. Para polling, consulte `GET /payments/pix/{orderId}`: `PAID` só é retornado depois da confirmação autenticada do webhook, `WAITING` enquanto pendente e `EXPIRED` quando expirado. O auto-avanço de cinco segundos do arquivo `PaymentPix.tsx` ainda deve ser desligado no frontend e o polling habilitado para usar o fluxo real.

## Lacunas de produção conhecidas

- O texto da descrição diz 25 produtos, mas o array mock contém 26; todos os 26 IDs e valores foram preservados no seed.
- NFC-e requer dados fiscais e provedor homologado; o adaptador deliberadamente não simula emissão.
- Impressão ESC/POS, worker e fila estão previstos; Redis está no Compose, mas a fila ainda não foi implementada.
- Criar tenant/admin é operação de provisionamento, sem endpoint público.
- O contador curto da senha precisa de tabela/lock transacional para impedir colisão com alto paralelismo e reinício diário; o MVP usa contagem de pedidos persistidos.

## Deploy

Use Postgres gerenciado ou volume persistente, TLS no proxy, origins CORS explícitas, credenciais de produção em secret manager, `JWT_SECRET` aleatório forte e contas Mercado Pago/fiscal de produção. Faça backup e ensaie restauração. A API não habilita `*` no CORS. Configure rate limiting no gateway para login e criação de pedido. Não envie dados reais de CPF a logs nem ambiente de desenvolvimento.
