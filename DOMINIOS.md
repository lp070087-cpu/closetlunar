# DOMINIOS — a classificacao da Fase 5

Cada dominio, e o que REALMENTE esta pronto. A regra de honestidade manda
separar **UI PRONTA** de **CODIGO PREPARADO** de **PERSISTENCIA REAL**.

## A definicao das classes

**A — INTEGRADO E TESTADO COM BANCO REAL.** Exige conexao. **Nenhum dominio
esta em A**, porque nao ha `DATABASE_URL` e o engine do Prisma nao roda neste
ambiente. Nao e uma falha de trabalho: e a credencial que falta.

**B — IMPLEMENTADO E PREPARADO, BLOQUEADO POR CREDENCIAL.** O codigo esta
escrito e provado; o que falta e a conexao.

**C — DEPENDE DE PROVIDER/DECISSAO EXTERNA.** Nao e bloqueio tecnico: falta uma
escolha do proprietario.

**D — NAO TRATADO.** **Zero.** Toda entidade dos 33 models tem dono no codigo.

## A tabela

| dominio | classe | UI | codigo | falta |
| ------- | ------ | -- | ------ | ----- |
| Produtos | **B** | admin + site | modelo + mapeador `paraProduto` | `DATABASE_URL` |
| Categorias | **B** | admin + site | modelo + mapeador `paraCategoria` | idem |
| Estoque | **B** | admin | modelo `StockMovement` | idem |
| Cupons | **B** | admin + site | modelo (`is_active` preservado) | idem |
| Pedidos | **B** | site + cliente + admin | modelo + mapeador `paraPedido` | idem |
| Clientes / Contas | **B** | site + cliente | modelos `User` + `UserSession` | idem |
| Conteudo do site | **B** | admin + site | modelos Hero/Seção/Banner/Benefício/Look | idem |
| Favoritos | **B** | site + cliente | modelo | idem |
| Carrinho | **B** | site | `lib/site/carrinho` (localStorage, do visitante) | idem |
| Endereços | **B** | cliente | colunas do pedido + perfil | idem |
| Fidelidade | **B** | admin + cliente | modelos `LoyaltyMovement`/`Reward` | idem |
| Afiliadas | **B** | admin + cliente | modelos `Affiliate`/`AffiliateSale` | idem |
| CRM | **B** | admin | modelo `CrmLead` | idem |
| Busca (analytics) | **B** | admin | modelo `SearchTerm` | idem |
| Atendimento / WhatsApp | **B** | admin | modelo `Ticket` (uma tabela) | idem |
| Segurança (auditoria) | **B** | admin | modelos `AuditLog`/`Backup` | idem |
| E-mails (histórico) | **B** | admin | modelos `EmailTemplate`/`EmailLog` | idem |
| Configurações | **B** | admin | modelo `Setting` (chave/valor) | idem |
| SEO | **B** | admin + site | `Setting` + rotas `robots`/`sitemap` | idem |
| Campanhas | **B** | admin | modelo `Campaign` | idem |
| Financeiro | **B** | admin | config de custos em `Setting` | idem |
| Relatórios | **B** | admin | **derivado** — nao tem tabela, por desenho | idem |
| Abrir Loja | **B** | admin | checklist em `Setting` | idem |
| Tamanhos | **B** | admin | modelos de regra/medida | idem |
| Provador | **B** | admin + cliente | `ProvadorUsage` | idem |
| **Pagamento** | **C** | site | **abstracao pronta, sem provider** | **decisao do proprietario** |
| **Frete** | **C** | site + admin | cotacao nao implementada | **provider a definir** |
| **Storage** | **C** | admin + site | contrato de URL pronto | **provider a definir** |
| **E-mail (envio)** | **C** | — | escrita de historico pronta | **provider a definir** |
| **WhatsApp (API)** | **C** | — | o LINK `wa.me` funciona | **provider a definir** |

## Por que nao ha nenhum A

Um dominio so entra em **A** quando se prova: tabela criada, linha lida, linha
gravada. Nada disso foi feito, e o `BACKEND-STATUS.md` registra as tres razoes
medidas — `DATABASE_URL` ausente, engine 403, cliente do Prisma ainda `any`.
**Declarar um A sem essas provas seria a desonestidade que a fase proibe.**

## Pagamento: por que C e CORRETO

O comando diz explicitamente: *"Pagamento deve permanecer C enquanto o
proprietario nao escolher gateway. Isso e CORRETO."*

O que a fase entregou:

- os **quatro estados neutros** (`pendente`/`processando`/`pago`/`recusado`) —
  vocabulario que QUALQUER gateway tem;
- a **forma** de um provider (a interface), **sem nenhuma implementacao**;
- `paymentExternalId` no pedido — **generico**, e nao `mercadoPagoPreferenceId`.
  Um nome de provider obrigaria a mexer no pedido depois de ele ter linhas;
- a **derivacao** `estadoPagamento -> statusPedido`, que e o que impede alguem
  marcar um pedido como `pago` a mao: so o gateway leva a `pago`;
- **nenhum** SDK instalado, **nenhum** nome de gateway no codigo novo.

O pedido pode ser criado **sem** gateway — `podeCriarPedido()` devolve `true`. A
loja nao para de funcionar ate a escolha sair.

## Uma mencao de gateway ANTERIOR a esta fase, que fica registrada

`src/components/admin/configuracoes/payments-tab.tsx` (**Fase 1**) tem uma secao
`InfinitePay` e uma `WEBHOOK_URL` com o caminho `/api/public/infinitepay/webhook`.

Isso **presume um gateway** que ainda nao foi escolhido. Nao foi corrigido aqui,
e deliberadamente: a tela **transcreve o print `adm-083`**, cujo titulo de secao
E `Pagamentos — InfinitePay` — apaga-lo seria divergir da referencia — e a Fase 1
esta aprovada (`NÃO altere Admin espontaneamente`).

**Fica registrado como o primeiro lugar onde a decisao do gateway encosta.** A
bancada afirma que a mencao existe e que esta so no admin.
