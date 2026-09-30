# FastLanches

Totem de autoatendimento para lanchonetes com pagamento via Pix. Este repositório contém o frontend React do projeto.

---
# Deploy temporário

Pagina do Totem
https://projeto-totens.vercel.app/welcome

---

Pagina do Admin
https://projeto-totens.vercel.app/admin

para ver da forma correta a resolução deve estar em 1080×1920 (Uma tv 1080p na vertical)

---

## Sobre o projeto

O sistema permite que o cliente faça um pedido completo sem interação com atendente. Ele navega pelo cardápio, monta o carrinho, informa CPF (opcional), escolhe se quer nota por email (opcional) e paga via Pix. No final recebe uma senha de retirada.

Três decisões definiram o produto:

**Somente Pix.** Outras formas de pagamento exigem hardware, integração e telas adicionais. Com Pix, o cliente resolve em poucos toques e a loja não precisa de maquininha.

**CPF e email são opcionais, e a gente deixa isso evidente.** As duas telas têm um botão principal grande para pular. Quem precisa informa, quem não precisa segue direto. Isso reduz o tempo na frente do totem e diminui fila.

**Layout para TV vertical 1080x1920.** Totem não é desktop. O cliente está a 60 centímetros de distância e o toque precisa ser preciso. Todo o CSS usa `vmin` e `clamp()`, então o layout escala junto com a tela.

### O que está pronto

- 31 telas navegáveis (17 do cliente, 6 de erro, 8 do admin)
- Fluxo completo de pedido do início ao fim
- Painel administrativo com dashboard, produtos, categorias e pedidos
- Preparação para backend real (services, hooks, tipos, mocks)

### O que ainda falta

- Backend FastAPI com PostgreSQL
- Integração real com Mercado Pago
- Impressão na cozinha
- Emissão fiscal
- Testes automatizados

---

## Rodando

```bash
git clone https://github.com/filipesilva-dev/ProjetoTotens
cd ProjetoTotens
npm install
cp .env.example .env
npm run dev
```

Abre em `http://localhost:5173`.

### Configuração do navegador

O layout é feito para TV em pé de 1080 por 1920 pixels. Abrir num navegador normal mostra tudo esticado. Para ver como o cliente veria:

1. Abre o Chrome
2. Aperta F12
3. Aperta Ctrl + Shift + M para abrir a barra de device
4. Define largura 1080 e altura 1920
5. Recarrega a página

---

## Estrutura de pastas

```
src/
  components/
    ui/            Design system genérico
    totem/         Componentes específicos do cliente
    admin/         Componentes específicos do painel
  config/          Constantes (marca, ambiente, alergênicos)
  contexts/        Estado global com Zustand
  hooks/           Lógica reutilizável
  layouts/         Frame comum das rotas
  mock/            Dados fake para desenvolvimento
  pages/
    totem/         Telas do cliente
    admin/         Telas do painel
  services/        Comunicação com a API
  styles/          Tokens, reset, overrides
  types/           Contratos TypeScript
  utils/           Funções puras
```

---

## Cada tela do totem

As telas seguem a ordem natural do cliente. Cada uma tem uma decisão de produto por trás.

### `/splash`

Tela de carregamento. Mostra o logo e um spinner por dois segundos enquanto o cardápio é buscado. Serve para cobrir o tempo de inicialização do totem, que leva alguns segundos para o sistema operacional subir.

### `/welcome`

Primeira tela depois do carregamento. Logo grande, nome da marca e um botão para iniciar o pedido. Não tem tutorial nem informação extra porque o cliente já sabe onde está.

### `/menu`

Cardápio principal. Sidebar à esquerda com categorias, grid de produtos à direita.

A sidebar usa ícones SVG em vez de emojis porque na primeira versão os emojis coloridos quebravam a paleta. Os ícones atuais são traços limpos que combinam com o laranja da marca.

Os produtos têm imagens reais do Unsplash, porque ainda não existe CDN de imagens própria. Cada card mostra foto, nome, descrição curta e preço.

### `/product/:id`

Detalhes do produto. Layout de duas colunas.

Coluna esquerda: descrição completa, ingredientes removíveis (o cliente desmarca o que não quer), adicionais pagos (bacon extra, queijo extra) e um campo de observações para recados à cozinha.

Coluna direita: alergênicos com ícones. Essa parte é fixa na lateral para ficar visível mesmo com scroll. Quem tem alergia precisa saber antes de pedir.

A imagem ocupa cerca de 30 por cento da altura da tela e o nome do produto aparece sobreposto a ela em um overlay escuro para dar legibilidade.

O rodapé tem o seletor de quantidade e o botão de adicionar.

### `/product-added`

Aparece depois que o cliente adiciona um produto. Mostra três sugestões do cardápio para upsell. Em produção essa lista deveria ser inteligente, baseada no que o cliente já tem no carrinho, mas para o MVP está com itens aleatórios.

### `/cart`

Se tem itens, mostra a lista com imagem pequena, nome, quantidade, seletor de mais e menos, e botão remover.

O botão remover abre um modal de confirmação porque no totem é fácil tocar sem querer.

### `/identification`

Pergunta se o cliente quer informar CPF na nota.

O botão principal é grande e laranja, dizendo "Seguir sem identificação". Abaixo de um divisor aparece o campo de CPF para quem realmente quiser.

A escolha de destacar o pular é intencional. A maioria das pessoas não precisa de nota fiscal e informar CPF leva tempo. Reduzir o caminho mais comum de quatro toques para um faz diferença em horário de pico.

### `/invoice-email`

Pergunta se o cliente quer receber a nota por email.

Mesma estratégia da tela anterior: botão grande para pular, campo de email embaixo para quem quiser.

### `/invoice-email/input` e `/invoice-email/confirm`

Se o cliente escolheu receber por email, essas telas aparecem.

A primeira tem o campo de email com sugestões de domínio (Gmail, Outlook). A segunda pede confirmação antes de prosseguir para evitar digitar errado.

### `/order/summary`

Última visualização antes do pagamento. Lista os itens, mostra o total e o email de nota fiscal se foi informado.

### `/payment`

Confirmação do método de pagamento. Como só existe Pix, essa tela não é uma escolha entre opções, é uma confirmação. Tem um card com o total e um botão grande para gerar o QR Code.

### `/payment/pix`

Tela do QR Code Pix. Mostra o código para escanear, o valor, três passos explicando como pagar e um indicador de status.

O cliente não clica em "já paguei". Quem confirma o pagamento é o webhook da API do Pix. Enquanto o backend não está pronto, existe um temporizador de cinco segundos que avança sozinho para a próxima tela, apenas para permitir testar o fluxo completo. Essa parte está marcada com um aviso no código, na constante `PAYMENT_AUTO_ADVANCE_MS`. Quando o backend estiver pronto, basta trocar o valor para `null`.

### `/payment/approved`

Confirmação de pagamento aprovado. Mostra o valor pago e o método. Um botão leva para a senha de retirada.

### `/order/confirmed`

Tela mais importante para o cliente. Mostra a senha em números grandes sobre um fundo laranja. É o que ele vai ouvir quando for chamado no balcão.

Também mostra o tempo estimado de preparo e um botão para imprimir o comprovante.

### `/order/printing`

Barra de progresso enquanto a impressora térmica trabalha. Depois de três segundos volta automaticamente para a tela inicial, pronta para o próximo cliente.

### Telas de erro

Todas seguem o mesmo padrão visual: ícone vermelho, título, explicação curta e botões de ação.

- `/error/payment-declined`: pagamento recusado. Deixa claro que o pedido está salvo e pode ser retomado.
- `/error/invalid-email`: email mal formatado com exemplos válidos.
- `/error/invalid-cpf`: CPF inválido com opção de tentar de novo ou seguir sem identificação.
- `/error/no-connection`: sem internet. Explica que os pedidos ficam salvos localmente.
- `/error/session-expired`: sessão expirou por inatividade.
- `/error/product-unavailable`: produto acabou no meio do pedido.

---

## Cada tela do admin

### `/admin/login`

Acesso restrito ao gerente. Hoje qualquer email e senha funcionam porque é mock, mas a estrutura já está pronta para JWT. O `AuthContext` grava o token no localStorage e o interceptor do axios injeta ele em toda requisição.

### `/admin`

Dashboard com os números do dia. Vendas, pedidos, ticket médio, percentual de Pix. Um gráfico de barras por hora e uma lista dos últimos pedidos.

Repare que não existe coluna de mesa. Como o pedido vem do totem e a retirada é feita no balcão por senha, não faz sentido ter mesa fixa. O campo `totemId` no pedido identifica qual totem gerou, o que importa quando a loja tem mais de um.

### `/admin/products`

Lista de produtos em formato de tabela. Cada linha tem foto miniatura, nome, categoria, se disponível ou não, preço e um botão editar.

### `/admin/products/new` e `/admin/products/:id`

O mesmo formulário serve para criar e editar. A rota decide qual modo usar.

Tem campos para nome, descrição, preço, categoria, URL da imagem, ingredientes removíveis (texto separado por vírgula), alergênicos (chips clicáveis) e disponibilidade.

O preview da imagem aparece ao lado conforme a URL é digitada.

### `/admin/categories`

Lista de categorias com botão editar em cada uma. Editar abre um modal com nome, seletor visual de ícone (cinco opções SVG) e ordem. Excluir também abre modal de confirmação.

### `/admin/orders`

Lista detalhada de pedidos.

A primeira versão era um kanban com colunas Novos, Preparando e Prontos. Isso funciona bem para a cozinha, mas é ruim para o gerente analisar. A versão final é uma tabela com filtros por status.

Cada linha mostra código do pedido, data e hora, quantidade de itens, totem de origem, status atual e valor. Clicar na linha expande com os detalhes: cada item do pedido com imagem, ingredientes removidos, adicionais, observações e dados do cliente se informados.

### `/admin/reports`

Faturamento do período, top cinco produtos mais vendidos e distribuição por forma de pagamento. Hoje a distribuição é sempre 100 por cento Pix, porque é a única forma suportada.

---

## Cada arquivo importante

### `src/services/`

Essa é a camada que o backend vai tocar mais. Nenhum componente chama axios diretamente. Tudo passa por aqui.

**`api.ts`** é o cliente axios configurado. Ele injeta o token JWT em toda requisição autenticada, normaliza os erros no formato `ApiError` e redireciona para o login quando recebe 401 no painel administrativo.

**`products.ts`**, **`categories.ts`**, **`orders.ts`** e **`payments.ts`** seguem o mesmo padrão: cada método verifica a flag `ENV.useMocks` e decide entre retornar dado mock ou chamar a API real.

A flag vem do `.env`:

```bash
VITE_USE_MOCKS=true    # usa mock local
VITE_USE_MOCKS=false   # chama a API real
```

Quando o backend estiver pronto, trocar essa flag já muda o comportamento de todo o sistema. Nenhum componente precisa ser alterado.

### `src/hooks/`

**`useProducts.ts`** e **`useCategories.ts`** fazem a mesma coisa: chamam o service correspondente e gerenciam os estados de `loading` e `error`. Componentes nunca lidam com isso diretamente.

**`useInterval.ts`** é um wrapper declarativo de `setInterval`. Usado para fazer polling do status do Pix.

### `src/contexts/`

Usamos Zustand porque é leve e simples.

**`CartContext.tsx`** guarda o carrinho com persistência em localStorage. A regra de mesclagem é: dois itens com mesmo produto, mesmos adicionais e mesmas observações viram uma linha só somando quantidade.

**`AuthContext.tsx`** guarda a sessão do admin. O token também é gravado direto no localStorage porque o interceptor do axios lê de lá.

### `src/types/`

Contratos TypeScript que espelham o que o backend deve retornar. Essa pasta é a fonte da verdade. Se o backend mudar um campo, mexe aqui primeiro e o TypeScript mostra tudo que quebra em cascata.

### `src/mock/`

**`menu.ts`** tem 25 produtos com imagens reais do Unsplash.

**`adminData.ts`** tem pedidos de exemplo para o painel.

Quando o backend entrar, essa pasta pode ser deletada.

### `src/styles/`

**`tokens.css`** concentra todas as cores, tamanhos, espaçamentos e raios. Nenhum componente usa valor literal, sempre `var(--color-primary)` ou `var(--space-4)`.

**`global.css`** tem o reset e a base.

**`screen.css`** tem classes utilitárias para os containers de tela.

**`kiosk.css`** aplica overrides quando `body.kiosk` está ativo, ou seja, dentro do totem. É onde a tipografia escala para 1080 por 1920.

### `src/components/ui/`

Design system genérico. `Button`, `Text`, `Input`, `Card`, `Modal`, `Spinner`, `QuantitySelector` e `Icon`. Nenhum desses componentes sabe que existe uma lanchonete. Eles poderiam ser usados em qualquer projeto React.

### `src/components/totem/`

Componentes específicos do fluxo do cliente. `ProductCard`, `Sidebar`, `CartItemRow`, `AllergenBadge` e `ProgressSteps`. Eles conhecem o domínio (produto, carrinho) mas não contêm regra de negócio.

### `src/components/admin/`

Componentes do painel. `KpiCard`, `BarChart` e `ToggleSwitch`.

---

## Checklist do backend

Ordem sugerida para implementar. Cada fase entrega algo testável.

### Fase 1 - Estrutura

- [ ] Criar projeto FastAPI com estrutura de pastas
- [ ] Configurar SQLAlchemy e Alembic
- [ ] Subir PostgreSQL local com docker-compose
- [ ] Criar tabelas `categories`, `products`, `orders`, `order_items`, `payments`
- [ ] Habilitar CORS para `http://localhost:5173`
- [ ] Popular o banco com os mesmos 25 produtos do mock

**Como testar**: trocar `VITE_USE_MOCKS=false` e verificar se o cardápio carrega do banco.

### Fase 2 - Catálogo

- [ ] `GET /categories` retornando lista ordenada
- [ ] `GET /products` com filtros opcionais de categoria e disponibilidade
- [ ] `GET /products/:id` retornando um produto

**Como testar**: abrir `/menu` no totem e `/admin/products` no painel. Ambos devem mostrar dados reais.

### Fase 3 - Pedidos

- [ ] `POST /orders` criando pedido
- [ ] Recalcular o total no backend a partir dos IDs dos produtos. Nunca confiar no total que vem do frontend.
- [ ] Gerar `code` de três dígitos para senha de retirada. Sugestão: contador diário que reinicia à meia-noite.
- [ ] `GET /orders/:id` para buscar um pedido
- [ ] `GET /orders` com filtro por status para o painel

**Como testar**: fazer um pedido no totem e verificar se aparece em `/admin/orders`.

### Fase 4 - Pix

- [ ] Criar conta no Mercado Pago ou outro PSP com suporte a Pix
- [ ] `POST /payments/pix` para gerar cobrança e salvar o QR Code
- [ ] `GET /payments/pix/:orderId` para consultar status
- [ ] `POST /webhooks/mercadopago` para receber confirmação do PSP
- [ ] Validar assinatura do webhook. Sem isso, qualquer pessoa consegue marcar pedido como pago.
- [ ] No webhook, publicar evento em fila de impressão

**Como testar**: descomentar o polling em `src/pages/totem/PaymentPix.tsx` (o código está pronto, só comentado com explicação) e remover o auto-avanço de teste. O status deve mudar sozinho após o pagamento.

### Fase 5 - Impressão e fiscal

- [ ] Configurar fila de impressão (RabbitMQ, Redis ou SQS)
- [ ] Criar worker que consome a fila e envia para impressora térmica
- [ ] Impressora ESC/POS (a maioria das marcas suporta)
- [ ] Integração fiscal em homologação para NFC-e
- [ ] Envio de email com a nota se o cliente informou endereço

### Fase 6 - Admin

- [ ] `POST /auth/login` com JWT
- [ ] CRUD de produtos (`POST`, `PUT`, `DELETE`)
- [ ] CRUD de categorias
- [ ] `GET /reports/daily` retornando KPIs
- [ ] `GET /reports/top-products` retornando mais vendidos

### Pontos de atenção

**Idempotência em `POST /orders`**. Se o cliente tocar duas vezes no botão ou a rede travar e reenviar, o pedido pode ser criado duas vezes. Usar uma chave de idempotência gerada pelo frontend.

**Nunca confie no total que vem do frontend**. Sempre recalcular a partir dos IDs dos produtos e adicionais no backend.

**Webhook pode chegar fora de ordem**. Um `approved` pode chegar antes de um `pending`. Guardar o payload bruto e validar o estado atual antes de atualizar.

**CORS em produção**. Não deixar `allow_origins=["*"]`. Especificar o domínio real do frontend.

**Datas no PostgreSQL**. Usar `TIMESTAMPTZ`, não `TIMESTAMP`. Fuso horário dá problema.

---

## Deploy

O projeto está configurado para deploy automático na Vercel.

Cada push no `main` dispara um build. A Vercel roda `npm install`, depois `npm run build`, e publica o conteúdo de `dist/` no CDN global.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run typecheck` | Verifica tipos sem gerar build |

---

## Contato

Dúvidas sobre decisões específicas de frontend: consultar quem escreveu o componente. A pasta git log ajuda.

Dúvidas sobre contratos da API ou modelagem de banco: esta documentação é a fonte principal. Se ela não responder, é sinal de que precisa ser atualizada.
