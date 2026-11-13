---
name: infinitepay-closet-lunna
description: Use ao mexer no pagamento da loja Closet Lunna — criar cobrança na InfinitePay a partir do pedido, receber o webhook, confirmar o pagamento com /payment_check, liberar o pedido (status pago, baixa de estoque, aviso) e diagnosticar pedidos que não liberaram.
---

# InfinitePay na Closet Lunna — receber, confirmar, liberar

Integração: **Checkout Integrado** da InfinitePay (Pix e cartão), base `https://api.checkout.infinitepay.io`.
Não usa chave de API: só a **InfiniteTag** (`handle`, sem `$`).

## Onde está cada peça

| Peça | Arquivo |
| --- | --- |
| Cliente HTTP (`/links`, `/payment_check`) | `src/lib/pagamento/infinitepay.ts` |
| Criar pedido + link (preços recalculados no servidor) | `src/lib/pagamento/checkout.ts` |
| Confirmar e liberar (idempotente) | `src/lib/pagamento/confirmar.ts` |
| Avisos (log, e-mail Resend, webhook genérico) | `src/lib/pagamento/avisos.ts` |
| API checkout | `src/app/api/checkout/route.ts` |
| Webhook | `src/app/api/pagamentos/infinitepay/webhook/route.ts` |
| Status/confirmação na volta | `src/app/api/pedidos/[id]/route.ts` |
| Tela da cliente (polling) | `src/components/site/status-pagamento.tsx` |
| Config no admin | `src/components/admin/configuracoes/integracoes-reais.tsx` + `src/lib/integracoes/` |

## Regra de ouro
O webhook da InfinitePay **não tem assinatura**. Nunca marque pago só porque o webhook chegou ou porque a cliente voltou pela `redirect_url`. Sempre `confirmarPagamento()` → `POST /payment_check` → libera só se `success && paid && amount >= total do pedido (centavos)`.

## Fluxo
1. `/checkout` → `POST /api/checkout` com cliente, endereço, itens (`produtoId`, tamanho, cor, qtd), `servicoFreteId`, cupom.
2. Servidor: preço do banco (promo > preço), estoque, frete re-cotado no Melhor Envio, cupom validado → cria `Order` (`paymentStatus=pendente`, `status=novo`).
3. `POST /links` com `order_nsu = Order.id`, `redirect_url = /pedido-confirmado/{id}`, `webhook_url = /api/pagamentos/infinitepay/webhook`, `items` em centavos (com desconto vira 1 linha com o total), `customer` e `address` (se a API recusar, tenta sem eles).
4. Cliente paga → InfinitePay chama o webhook e devolve a cliente com `transaction_nsu`, `slug`, `receipt_url`, `capture_method` na URL.
5. Webhook e tela chamam `confirmarPagamento()`; a transação usa `updateMany where paymentStatus != 'pago'` como trava → só um deles baixa estoque, conta o cupom, grava `AuditLog` e dispara o aviso.
6. Webhook responde 200 se pago; 400 faz a InfinitePay tentar de novo.

## Avisos de "pagamento feito"
- Cliente: tela `/pedido-confirmado/{id}` troca para "Pagamento confirmado!" e esvazia a sacola.
- Loja: pedido aparece como **pago** em `/admin/pedidos`; log `[pagamento] PEDIDO PAGO #CODIGO` na Vercel.
- Opcionais (variáveis na Vercel): `RESEND_API_KEY` + `AVISO_EMAIL_REMETENTE` (+ `AVISO_EMAIL_LOJA`) para e-mail; `AVISO_WEBHOOK_URL` para Make/Zapier/n8n/bot de WhatsApp.

## Configuração
- InfiniteTag: Admin → Configurações → Pagamentos (grava em `Setting` `integracao_infinitepay`); fallback `INFINITEPAY_HANDLE` na Vercel (conta Closet Lunar: `closetlunaar`).
- "Testar conexão" cria um link de R$ 1,00 sem pedido (ninguém é cobrado).

## Diagnóstico de pedido que não liberou
1. `SELECT id, code, "paymentStatus", status, total FROM "Order" WHERE code='CL...';`
2. Logs da Vercel: procurar `[pagamento]` e chamadas a `/api/pagamentos/infinitepay/webhook`.
3. Com `transaction_nsu` e `slug` do comprovante, `POST /api/pedidos/{id}` `{transaction_nsu, slug}` reprocessa com segurança (idempotente).
4. Nunca altere `paymentStatus` para `pago` à mão sem conferir no painel da InfinitePay.

## Teste antes de vender
Compra real de menor valor no Pix → pedido `pago`, estoque baixou, aparece em `/admin/pedidos`. Peça autorização do dono da loja antes de qualquer compra de teste.
