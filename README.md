# Closet Lunna

Projeto novo da Closet Lunna, separado das pastas de referência. Contém três
áreas, entregues em fases:

1. **Painel Admin** (`/admin`) — em construção. Fase 1 concluída: fundação.
2. **Painel do Cliente** (`/conta`) — próxima fase.
3. **Site público** — fase seguinte.

## Stack

| Camada | Escolha |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| UI | React 19 + TypeScript (strict) |
| Estilo | Tailwind CSS 3 + tokens em CSS custom properties |
| Ícones | lucide-react |
| Banco | Neon PostgreSQL (via Prisma) — ainda não conectado |
| Deploy | Vercel |

Materiais de referência **não** fazem parte deste projeto e não são alterados:
`Painel admin/`, `Painel do cliente/`, `referencia visual do site/`,
`vivence-joias-main/`, `PROJETO-ORIGINAL-LOVABLE-REFERENCIA/`.

## Como rodar

```bash
npm install
npm run dev          # http://localhost:3000/admin
```

Validações:

```bash
npm run typecheck    # tsc --noEmit
npm run lint
npm run build
```

O banco ainda não é necessário para navegar pelo painel: a Fase 1 usa dados de
demonstração em `src/lib/mock.ts`. Copie `.env.example` para `.env` quando for
conectar o Neon.

## Por que não há `prisma/schema.prisma` ainda

A Fase 1 é a fundação visual e de navegação: 33 rotas, design system e
componentes compartilhados. O schema será escrito junto com o primeiro módulo
que precisar persistir dados, para que as tabelas nasçam dos campos reais das
telas em vez de um rascunho adivinhado. A conexão já está prevista em
`.env.example` (`DATABASE_URL` com pooler + `DIRECT_URL` para migrations).

## Estrutura

```
src/
  app/
    globals.css              tokens visuais (cores, sombras, raios, utilitários)
    layout.tsx               fontes e metadados globais
    admin/
      layout.tsx             casca do painel (server)
      layout-client.tsx      item ativo derivado da URL
      page.tsx               Dashboard
      <modulo>/page.tsx      32 telas de módulo, uma rota cada
  components/
    admin/
      admin-shell.tsx        sidebar + topbar + conteúdo
      sidebar.tsx            navegação com os 7 grupos
      module-page.tsx        moldura das telas de módulo
    ui/                      biblioteca compartilhada (botão, card, tabela...)
  lib/
    nav.ts                   inventário oficial de navegação (fonte da verdade)
    access.ts                sessão e regras de papel
    utils.ts                 cn, moeda, data, slug, iniciais
    mock.ts                  dados de demonstração
```

## Fidelidade visual

Os valores do design system foram **medidos** nos prints do painel, não
escolhidos por gosto:

| Token | Valor | Origem |
| --- | --- | --- |
| Fundo do painel | `#F7EDE2` (`canvas`) | amostragem de pixel nos prints |
| Tinta do sistema | `#14110E` (`foreground`) | idem |
| Verde de status | `#00BC7D` sobre `#D0FAE5` | idem |
| Vermelho destrutivo | `#DE3C36` | idem |
| Âmbar de estoque | `#FEF3C6` | idem |
| Serifada | Cormorant Garamond | projeto de referência |
| Sans | Inter | projeto de referência |
| Sidebar / topbar | 256px / 64px | medição nos prints |
| Conteúdo | máx. 1600px centralizado | idem |

Regras que valem para todo o painel:

- Sidebar: 7 grupos e 33 itens, **nesta ordem**, com estes rótulos. Não
  reordenar, renomear, remover nem acrescentar.
- O rótulo do item ativo **trunca** quando não cabe. Isso é reprodução fiel do
  original, não defeito a corrigir.
- Título e números em serifada; rótulos em caixa alta minúscula com tracking.
- Botão principal é pílula preta em versalete.
- Textos reais da referência são preservados, incluindo estados vazios
  ("Sem vendas no período.").

## Acessibilidade

Foco visível em todos os controles, `aria-current` no item ativo da sidebar,
modal com `role="dialog"`, `aria-modal`, fechamento com `Esc`, foco preso no
diálogo e devolvido ao elemento de origem, alvo de toque de 44px no mobile,
`<html lang="pt-BR">`, e respeito a `prefers-reduced-motion`.

## Responsividade

A adaptação é por comportamento, não por redução proporcional:

| Faixa | Comportamento |
| --- | --- |
| < 640px | sidebar vira drawer, KPIs em 1 coluna, tabelas rolam na horizontal, inputs com 16px (evita zoom do iOS) |
| 640–1024px | KPIs em 2 colunas, modal ocupa a largura útil |
| 1024–1280px | sidebar fixa, KPIs em 3 colunas |
| > 1280px | grade de 4 colunas, conteúdo limitado a 1600px |
