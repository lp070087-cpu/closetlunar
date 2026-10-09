# BACKEND-MAP — Fase 4 (persistencia real)

Fonte da verdade desta fase. Liga cada **entidade** ao seu **dono no codigo**, ao
**model do banco** e ao **consumidor**.

## O ponto de partida, medido no disco

- `prisma/` existe e esta **VAZIO**. `prisma/schema.prisma` **nao existe**.
- `prisma` e `@prisma/client` **6.3.1** estao no `package.json`.
- **Nenhum arquivo de `src/` importa `@prisma/client`.** O banco nunca foi ligado.
- Existe **apenas `.env.example`** — nao ha `.env` nem `.env.local`.
  `DATABASE_URL` e `DIRECT_URL` estao declarados **no template**, com host de
  exemplo (`ep-xxxx`). **Nao ha credencial real.**
- Os provedores que o template nomeia: `PAYMENT_PROVIDER` (comentario:
  *Mercado Pago / InfinitePay*), `MELHOR_ENVIO_*` (frete), `WHATSAPP_*`, `SMTP_*`.

**Consequencia direta:** `BLOQUEADO POR CREDENCIAL NEON` em tudo que exigir
conexao. O que da para fazer sem ela — schema, camada de dados, arquitetura de
auth, migrations geraveis, testes independentes — e o que esta fase entrega.

## As 26 libs de dominio, classificadas

**A — persiste** (vira tabela):

| lib | entidade do banco | quem consome |
| --- | ----------------- | ------------ |
| `produtos` | `Product`, `ProductImage`, `ProductColor` | admin, site, cliente |
| `categorias` | `Category` | admin, site |
| `estoque` | `StockMovement` | admin |
| `cupons` | `Coupon`, `CouponUsage` | admin, cliente, site |
| `campanhas` | `Campaign` | admin |
| `carrinho-abandonado` | `AbandonedCart` | admin |
| `fidelidade` | `LoyaltyMovement`, `LoyaltyReward` | admin, cliente |
| `afiliadas` | `Affiliate` | admin, cliente |
| `pedidos` | `Order` (+ itens, pagamento, entrega, cliente) | admin, cliente |
| `usuarios` | `User` | admin |
| `crm` | `CrmLead` | admin |
| `emails` | `EmailLog`, `EmailTemplate` | admin |
| `whatsapp`/`atendimento` | `Ticket` (**uma so**) | admin |
| `busca` | `SearchTerm` | admin |
| `seguranca` | `AuditLog`, `Backup` | admin |
| `provador` | `ProvadorUsage` | admin |

**B — configuracao global** (linha chave/valor, ou uma linha por ajuste):

| lib | o que guarda |
| --- | ------------ |
| `configuracoes` | zonas de entrega, provedor de frete, pagamento |
| `conteudo` | hero, categorias do site, secoes da home, banners, beneficios, instagram, rodape, temas, looks |
| `seo` | a config de SEO |
| `financeiro` | custos financeiros |
| `abrir-loja` | o checklist |

**C — derivado, NAO persiste** (conta em cima de dados que ja existem):

`relatorios` (agrega produtos/categorias/clientes), `busca` como *analytics*
(agrega `SearchTerm`), as `StockStats`/`CartStats`/`TicketCounts`.

**D — sem persistencia**:

`favoritos` do admin (le a mesma relacao de `FavoriteRow`), `atendimento` como
*projecao* de `Ticket` (abaixo).

## As duas duplicacoes que JA existem no codigo — e como o banco as resolve

Isto e o que a condicao da fase quer dizer com *"nao criar 3 categorias"*. As
duplicacoes sao no TYPESCRIPT, e o banco tem **uma** tabela para cada:

**1. `Category` existe em `produtos/types.ts` e em `categorias/types.ts`.**

```ts
// produtos/types.ts      // categorias/types.ts
{ id, name, slug }        { id, name, slug, image, sortOrder, isActive,
                            productCount, metaTitle, metaDescription,
                            introText, createdAt, updatedAt }
```

O de `produtos` e um SUBconjunto — ele so precisa do nome para a coluna
"Categoria" da tabela de produtos e para o filtro. **Uma tabela `categories`.** O
`produtos.Category` continua sendo o tipo leve da tela; a LEITURA devolve o
registro completo, e o subconjunto e uma projecao dele. Nenhuma tela quebra
(35 arquivos importam o tipo de `produtos` e 6 o de `categorias`).

**2. `Ticket` existe em `whatsapp/types.ts` e em `atendimento/types.ts`.**

| campo | `whatsapp` | `atendimento` |
| ----- | ---------- | ------------- |
| id / status / createdAt | sim | sim |
| nome | `customerName` | `customerName` |
| telefone | `customerPhone` | `phone` |
| mensagem | — (tem `product`) | `message` |
| origem / produto | `origin`, `product` | — (tem `message`) |

O de `whatsapp` e um SUPERconjunto (tem `origin` e `product`; nao tem `message`).
Nove arquivos dependem dos dois. **Uma tabela `tickets`**, com TODAS as colunas;
cada modulo projeta as que usa. O nome da coluna do telefone e um so no banco
(`customer_phone`), e cada tipo mapeia o seu rotulo.

## O que o banco NAO vai criar

- **Um catalogo por area.** Produto, categoria, pedido, cupom e estoque tem UM
  dono. Admin, cliente e site leem a mesma tabela.
- **Tabela para derivado.** Nada de `product_count` gravado, nem `stock_stats`,
  nem `cart_stats`, nem `ticket_counts`: sao contas sobre linhas que existem. Um
  contador gravado diverge no dia em que uma linha muda de lugar.
- **Tabela para o que nao tem tela.** `SearchTerm` existe porque a tela de Busca
  existe; nao vai nascer tabela de nada que nenhuma tela leia.
- **Coluna de senha em texto puro.** A senha e HASH, e so entra pela camada de
  auth — o type de dominio nunca a transporta (regra herdada do modulo
  `Segurança` da Fase 2).

## BLOQUEADO POR CREDENCIAL NEON

Nao ha `DATABASE_URL`. Sem ela:

- `prisma migrate dev` **nao roda** (nem `db push`);
- nao ha como provar conexao, tabela criada nem linha lida;
- o `@prisma/client` **nao gera** sem `schema.prisma` + provider resolvido —
  e o provider so resolve com a URL.

**Nao sera inventado** `DATABASE_URL`, `DIRECT_URL`, senha, token ou secret. O
que esta fase entrega e tudo que independe da credencial: o schema completo, a
camada de dados com o contrato pronto, a arquitetura de sessao, as migrations
geraveis e as bancadas que provam o que da para provar sem conexao.

## Decisoes externas pendentes (nao inventadas)

| dominio | estado | por que |
| ------- | ------ | ------- |
| Pagamento | **GATEWAY A DEFINIR** | o `.env.example` sugere *Mercado Pago / InfinitePay*, e `project_inst_acessor_infinitepay` registra InfinitePay como escolha de OUTRO projeto. **Escolher por conta propria seria inventar.** |
| Frete | aguarda `MELHOR_ENVIO_*` | o template nomeia Melhor Envio; sem credencial nao ha cotacao |
| E-mail | **AGUARDA PROVIDER** | `SMTP_*` vazio; a newsletter nao grava |
| WhatsApp | **AGUARDA PROVIDER** | a Fase 3 usa **link** `wa.me`, que nao precisa de API. A Cloud API (`WHATSAPP_*`) e outra coisa, e nao ha credencial |
| Storage | **A DEFINIR** | hoje as imagens sao `data:`/`/site/*`; o template nao nomeia storage |

## Ordem de execucao da fase

1. `prisma/schema.prisma` — derivado dos `types.ts`, sem campo que nenhuma tela use.
2. A camada de dados: `lib/db.ts` (cliente singleton) + a sessao.
3. As bancadas que provam sem conexao.
4. `BACKEND-STATUS.md`.
