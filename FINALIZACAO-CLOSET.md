# Closet Lunna — status de finalização (13/11/2026)

Produção: https://closetlunar.vercel.app (deploy automático a partir da branch `main`).

## O que está ligado de verdade

| Área | Estado |
| --- | --- |
| Banco | **Neon `closet-lunna`** (sa-east-1). Schema aplicado (`prisma db push`), seed com 7 categorias, 6 produtos, cupom `PRIMEIRA10`, conteúdo e conta admin. |
| Login | Sessões reais no banco. Admin criado pelo seed com credenciais do `.env` local (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Segredo de sessão: `SESSION_SECRET` ou, se ausente, derivado da credencial do banco. |
| Catálogo | Site e admin leem/gravam **Produtos** e **Categorias** no banco. Vitrine revalida a cada 60 s. |
| Fotos | Upload do admin envia para o **Vercel Blob** (`closet-lunna-fotos`, gru1) e grava a URL pública. |
| Checkout | Dados da cliente, endereço com ViaCEP, frete, cupom e resumo. Tudo recalculado no servidor. |
| Pagamento | **InfinitePay Checkout Integrado** (Pix e cartão). Webhook + `/payment_check` antes de liberar. Testado: link real gerado e webhook forjado recusado. |
| Liberação | Pago → pedido `pago`, estoque baixa (com `StockMovement`), cupom contabilizado, `AuditLog`, aviso. Idempotente. |
| Frete | **Melhor Envio** (cotação `/api/v2/me/shipment/calculate`), frete grátis acima de R$ 299 (configurável), frete fixo de contingência (desligado). |
| Pedidos (admin) | `/admin/pedidos` lê do banco (somente admin). |
| Skill | `.claude/skills/infinitepay-closet-lunna/SKILL.md` |

## Único passo manual pendente
**Token do Melhor Envio.** Sem ele o checkout mostra "frete indisponível" e não deixa pagar.
1. Entrar em melhorenvio.com.br → Integrações → Permissões de acesso → Gerar novo token (marcar permissões de frete/envio).
2. No site: `/admin/configuracoes` → aba Melhor Envio → colar o token, informar o **CEP de origem** da loja → Salvar → Testar cotação.

## Recomendado antes de vender
- Pagamentos caem na conta InfinitePay **Closet Lunar** (`$closetlunaar`, Carinna Tavares).
- Fazer uma compra real de menor valor no Pix e conferir em `/admin/pedidos`.
- Cadastrar fotos reais nos produtos (o seed não tem imagens).
- Opcional: `RESEND_API_KEY` + `AVISO_EMAIL_*` para e-mails de pedido pago.

## Ainda em modo demonstração (não bloqueiam a venda)
Os módulos administrativos secundários (CRM, campanhas, fidelidade, afiliadas, relatórios, e-mails, atendimento, entrega própria por bairro, provador/avatar) continuam com telas prontas e dados de demonstração onde o `data.ts` ainda não lê do banco. Pedidos, produtos, categorias, pagamentos e frete — o caminho da venda — estão reais.
