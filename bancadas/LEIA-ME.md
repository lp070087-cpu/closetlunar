# Bancadas

Provas de execução do painel. Elas existem porque o ambiente onde o projeto foi
escrito **não consegue rodar `next dev` nem `next build`** (sem rede, o
`next/font/google` espera as fontes para sempre). Sem elas, a única garantia
seria o `typecheck` — que não pega erro de execução nem ramo invertido.

Cada bancada compila os `.ts`/`.tsx` com o TypeScript do próprio projeto e
renderiza com `react-dom/server`. Rode da **raiz do projeto**:

```bash
node bancadas/bench-apresentacao.mjs .   # 35 provas — as 5 telas da apresentação
node bancadas/bench-branch.mjs .         #  6 provas — o ramo de estoque baixo
node bancadas/bench-metricas.mjs .       # 11 provas — lucro/margem nas 3 telas
node bancadas/bench-categorias.mjs .     # 62 provas — o módulo Categorias
node bancadas/bench-tamanhos.mjs .       # 73 provas — o módulo Tamanhos
node bancadas/bench-estoque.mjs .        # 88 provas — o módulo Estoque
node bancadas/bench-pedidos.mjs .        # 83 provas — o módulo Pedidos
```

Todas as bancadas chamam `createRequire`, que **exige caminho absoluto**: passe
`.` (elas resolvem) ou o caminho completo. Uma bancada sem as cinco rodando não
prova nada — o `next dev` / `next build` continuam sendo a única prova de layout.

`bench-tamanhos.mjs` renderiza `MeasureSection`, `RuleSection` e
`SizeIntelligence` **com dados**, e não a `SizeGuideView`. O motivo está na
própria bancada: `renderToStaticMarkup` não roda `useEffect`, então a tela que
carrega dentro de um efeito devolve o **esqueleto** — procurar o título nela
acusaria defeito inexistente. Por isso o cabeçalho de cada bloco mora num
componente apresentacional, que a bancada renderiza de verdade.

**A ordem da Tabela de Medidas é ALFABÉTICA, não é ordem de tamanho.** O print
adm-032 mostra `G, GG, M, P, PP` — que é exatamente a ordem alfabética. Ordenar
por régua dá outra coisa nos dois sentidos (crescente: `PP, P, M, G, GG`;
decrescente: `GG, G, M, P, PP`), e as duas estão erradas. `SIZE_ORDER` continua
existindo só para responder "XG é maior que G?", e a bancada tem asserção
comparando a saída com a ordenação alfabética **e** provando que ela não é a
ordem de tamanho em nenhum dos dois sentidos. Sem isso, o próximo "conserto"
inverte a tabela em silêncio.

**Rode UMA bancada por chamada.** Cada uma compila o módulo do zero; duas ou
três no mesmo comando estouram o limite de ~178 s do shell. `bench-branch.mjs` e
`bench-apresentacao.mjs` compilam o `src` INTEIRO (89 arquivos) e precisam de
`timeout 165` — 90 s não bastam e o `timeout` mata a bancada no meio.

Quatro das bancadas passam de 90 s: `bench-tamanhos` (~110 s),
`bench-apresentacao` (~151 s), `bench-categorias` e `bench-estoque`. Use
`timeout 176` nelas. Se o `timeout` disparar, o rodapé `N provas, M falha(s)`
não aparece — **`EXIT=124` com saída cortada é tempo esgotado, não defeito no
projeto.** Sem o rodapé, a rodada não conta como prova.

## As raízes de compilação são ESTREITAS de propósito

Cada bancada limita `rootNames` ao **módulo que ela renderiza**, e não ao `src`
inteiro. Isso não é economia de estilo — é o que mantém a bancada **viva**: uma
bancada que compila tudo morre no limite de ~178 s do shell **antes de imprimir
o rodapé**, e uma rodada sem rodapé não prova nada.

`bench-metricas.mjs` e `bench-branch.mjs` compilavam o `src` inteiro e passaram a
estourar quando o projeto chegou a 108 arquivos (o módulo Pedidos entrou na Fase
6). As raízes foram estreitadas para `lib/produtos` + `components/admin/produtos`
e para `app/admin/page.tsx`. **Isso não afrouxou prova nenhuma:** o TypeScript
segue os `import` de uma raiz, então `ui/*` e `lib/utils` continuam entrando
sozinhos, e as mesmas superfícies continuam sendo renderizadas.

A emissão do projeto inteiro não fica descoberta: ela é responsabilidade do
`npm run typecheck`, que roda sobre o `tsconfig.json` e não tem esse limite.
Cada bancada prova **render**; o typecheck prova **compilação**.

**Rode uma bancada por chamada** e, se a saída vier cortada, confira se o rodapé
saiu antes de concluir qualquer coisa.

`bench-estoque.mjs` tem uma seção a mais no fim: **a bancada se ataca de
propósito** com quatro agulhas sabidamente erradas, pelas mesmas funções que
usou nas provas. Se alguma delas passar, o instrumento está quebrado e o resto
do relatório não vale. É a resposta ao defeito mais caro deste tipo de bancada:
uma prova que passa em qualquer coisa diz exatamente o mesmo que uma tela vazia.

Cada uma cria uma pasta `.bench-*` (já ignorada pelo git) e sai com código 0
quando passa. Para conferir que a bancada **sabe falhar**, quebre de propósito
uma das agulhas que ela procura: se continuar dizendo "ok", a prova não vale.

O que elas **não** provam: layout, cor, posição e responsividade. Isso é
navegador — `npm run dev` e abrir `/admin/produtos` e `/apresentacao-admin`.
