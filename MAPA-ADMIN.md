# Mapa do Painel Admin — ordem de implementação

Registro do mapeamento dos 89 prints (`Painel admin/`). O painel tem **1
dashboard + 30 módulos = 31 telas**, e a navegação tem exatamente **31 itens**
em 7 grupos — confirmado por comparação automática com o código do projeto
original (`NAV_GROUPS` em `PROJETO-ORIGINAL-LOVABLE-REFERENCIA/src/routes/admin.tsx`).

## Inventário confirmado (7 grupos / 31 itens)

Ordem e rótulos idênticos ao original, incluindo os papéis de cada item:

| Grupo | Itens |
| --- | --- |
| Visão geral | Dashboard |
| Vendas | Pedidos · Carrinho Abandonado · CRM · Cupons · Campanhas · Fidelidade · Afiliadas · Financeiro |
| Catálogo | Produtos · Estoque · Categorias · Tamanhos · Avatar Virtual · Provador Virtual · IA de Looks |
| Conteúdo | Banners · Conteúdo do Site · Personalizar Loja · Looks |
| Insights | Relatórios · Favoritos · Busca |
| Comunicação | WhatsApp · E-mails · Atendimento |
| Sistema | Configurações · SEO & Google · Usuários / Admins · Segurança & Backup · Abrir Loja |

## Ordem sugerida das próximas fases

Seguindo a dependência real entre os dados (catálogo alimenta o resto):

**Fase 2 — Catálogo (a base de tudo)**
1. Produtos — `adm-025` a `adm-027` (lista + modal Novo Produto + base do modal)
2. Estoque — `adm-028` e `adm-029` (KPIs + tabela + histórico de movimentações)
3. Categorias — `adm-030` e `adm-031`
4. Tamanhos — `adm-032` a `adm-037` (matriz de medidas + regras por produto)

Estes quatro definem o schema do banco. Nada mais faz sentido antes deles.

**Fase 3 — Vendas**
5. Pedidos — `adm-003` e `adm-004`
6. CRM — `adm-005`, `adm-010` e `adm-011`
7. Campanhas — `adm-006`, `adm-015` a `adm-017`
8. Cupons — `adm-007`, `adm-012` a `adm-014`
9. Carrinho Abandonado — `adm-008` e `adm-009`
10. Fidelidade — `adm-018` a `adm-020`
11. Afiliadas — `adm-021` e `adm-022`
12. Financeiro — `adm-023` e `adm-024` (8 KPIs + gráficos + custos + lucro)

**Fase 4 — Provador e IA**
13. Avatar Virtual — `adm-038` a `adm-042` (inclui a aba VINCULAR PRODUTOS)
14. Provador Virtual — `adm-043` a `adm-046` (3 abas: base, LOOKS SALVOS, ANALYTICS)
15. IA de Looks — `adm-047` a `adm-050` (inclui CONFIGURAÇÕES DA IA)

**Fase 5 — Conteúdo**
16. Banners — `adm-051` e `adm-052` (lista + modal Novo Banner)
17. Conteúdo do Site — `adm-053` a `adm-059` (7 abas)
18. Personalizar Loja — `adm-060`
19. Looks — `adm-061` e `adm-062`

**Fase 6 — Insights e Comunicação**
20. Relatórios — `adm-063` a `adm-066`
21. Favoritos — `adm-067`
22. Busca — `adm-068`
23. WhatsApp — `adm-069` a `adm-071`
24. E-mails — `adm-072` e `adm-073`
25. Atendimento — `adm-074`

**Fase 7 — Sistema**
26. Configurações — `adm-075` a `adm-083` (Entrega Própria / Melhor Envio / Integração Transportadoras / Pagamentos)
27. SEO & Google — `adm-084`
28. Usuários / Admins — `adm-085`
29. Segurança & Backup — `adm-086`
30. Abrir Loja — `adm-087` a `adm-089` (checklist "6 DE 9 ITENS PRONTOS / 67%")

> **Correção registrada em 2026-09-28.** Os intervalos desta seção estavam
> errados: diziam que Produtos era `adm-032` a `adm-040` e Financeiro ia até
> `adm-031`, o que jogaria dois módulos diferentes para cima do mesmo número.
> Os valores acima foram **derivados do catálogo** (`_catalog/admin-01.md` a
> `admin-06.md`), lendo o campo `Tela:` de cada print — não estimados por faixa.
> O material não é contíguo por módulo: ele segue a ordem de construção do
> painel original, então quase todo módulo fica com prints espalhados.

O catálogo detalhado de cada print está em `_catalog/admin-01.md` a
`admin-06.md`.

## Tokens medidos (não escolhidos por gosto)

| Token | Valor | Token | Valor |
| --- | --- | --- | --- |
| Fundo do painel | `#F7EDE2` | Tinta do sistema | `#14110E` |
| Verde de status | `#00BC7D` sobre `#D0FAE5` | Texto do verde | `#007A55` |
| Vermelho destrutivo | `#DE3C36` | Superfície rosa | `#FFE4E6` |
| Âmbar de estoque | `#FEF3C6` | Cinza de rótulo | `#69625D` |
| Sidebar | 256px | Topbar | 64px |
| Conteúdo | máx. 1600px centralizado | Raio base | 12px |

Tipografia: **Cormorant Garamond** (títulos e números) + **Inter** (interface),
servidas por `next/font/google` como `--font-serif` e `--font-sans`.

## Pendências registradas

Coisas que os materiais não permitem determinar com segurança. Nada aqui
bloqueou a Fase 1; ficam para quando a tela correspondente for construída.

1. **Nome da marca grafado de 3 formas — RESOLVIDO em 2026-09-28.** Os prints
   mostram `Closet Lunar` (painel) e `Closet Lunar` / `@closetlunar` (área da
   cliente); o briefing oscilava entre `Closet Lunna` e `Closet Lunnar`. A
   grafia oficial passou a ser **Closet Lunnar** (o briefing manda usar
   "Closet Lunnar" no projeto novo). Os arquivos de referência continuam com a
   grafia antiga de propósito — não foram alterados. **Pendente:** o que já
   estava escrito no projeto (`metadata` do layout raiz, sidebar, `lib/nav.ts`,
   Dashboard) ainda diz `Closet Lunna`. Alinhar na próxima rodada, junto com
   rodapé, e-mails e SEO, que ainda não existem.
2. **`Carrinho Abandonado` nunca aparece inteiro** nos prints: a sidebar corta
   em "Carrinho Abandona...". O rótulo completo foi confirmado no código
   original, não visualmente.
3. **E-mail do usuário divergente:** os prints do painel mostram
   `lp070087@gmail.com`, e um print da área da cliente mostra `lpo70087`
   (zero vs letra o). Usado `lp070087@gmail.com`.
4. **Status inconsistente entre telas:** `#FF3048C9` aparece como `NOVO` no
   dashboard e como `AGUARDANDO PAGAMENTO` em Meus Pedidos. Padronizar a máquina
   de estados do pedido antes de implementar Pedidos.
5. **Badge `Ativo` com duas cores:** preto em Cupons, verde em Afiliadas.
   Padronizar ao implementar cada tela.
6. **Convenção de ação mista:** `Desativar/Editar/Excluir` em minúsculas no
   Catálogo e Conteúdo, mas `EDITAR/DESATIVAR` em versalete em Banners.
7. **Erros de dados visíveis na referência** que NÃO devem ser reproduzidos:
   a tela de Benefícios imprime nomes de ícone como texto (`Truck`,
   `CreditCard`, `ShieldCheck`), e a tela de Rodapé tem links apontando para
   `/admin` (loop).
8. **Data em formato híbrido:** `16/06/2026, 14:56:54` (pt-BR com vírgula e
   segundos) — confirmado nos prints e implementado em `formatDateTime`.
