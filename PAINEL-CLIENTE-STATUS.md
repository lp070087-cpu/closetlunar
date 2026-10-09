# PAINEL-CLIENTE-STATUS — Fase 2

Arquivo de retomada. Mantido **compacto** e atualizado a cada modulo.

## Cabecalho

- Projeto: `closet-lunnar`
- Fase: **2 — Painel do Cliente**
- Rota base: **`/conta`** (comprovada pela barra de URL do print `004709`)
- Prints: **20 arquivos / 10 telas** (ver `MAPA-CLIENTE.md`)
- Admin: **ENCERRADO**, nao alterado (ver "Alteracoes compartilhadas")

## Modulos

| # | Modulo | Rota | Status |
| - | ------ | ---- | ------ |
| 1 | Fundacao (nav + escopo + fonte) | — | **PRONTO** (83/83) |
| 2 | Casca (layout + nav + mobile) | `/conta` | **PRONTO** (83/83) |
| 3 | Login (demo) | porta de `/conta` | **PRONTO** (71/71) |
| 4 | Dashboard | `/conta` | **PRONTO** (61/61) |
| 5 | Meus Pedidos | `/conta/pedidos` | **PRONTO** (76/76) |
| 6 | Favoritos | `/conta/favoritos` | **PRONTO** (43/43) |
| 7 | Enderecos | `/conta/enderecos` | **PRONTO** (95/95) |
| 8 | Minhas Medidas | `/conta/medidas` | **PRONTO** (88/88) |
| 9 | Clube VIP & Cashback | `/conta/pontos` | **PRONTO** (99/99) |
| 10 | Cupons | `/conta/cupons` | **PRONTO** (76/76) |
| 11 | Dados da Conta | `/conta/dados` | **PRONTO** (85/85) |
| 12 | Segurança | `/conta/seguranca` | **PRONTO** (99/99) |
| 13 | Afiliada | `/conta/afiliada` | **PRONTO** (100/100) |

Os modulos 1 e 2 foram entregues na MESMA rodada e sao cobertos pela mesma
bancada: a fundacao e o contrato de navegacao da casca, e separa-los em duas
bancadas duplicaria as mesmas 14 provas de `NAV_ITEMS`.

## Bancadas do cliente

| Bancada | Provas | Status |
| ------- | ------ | ------ |
| `bench-cliente-nav.mjs` | **83/83** | **PASSA** |
| `bench-cliente-conta.mjs` | **62/62** | **PASSA** |
| `bench-cliente-login.mjs` | **71/71** | **PASSA** |
| `bench-cliente-pedidos.mjs` | **76/76** | **PASSA** |
| `bench-cliente-favoritos.mjs` | **43/43** | **PASSA** |
| `bench-cliente-enderecos.mjs` | **95/95** | **PASSA** |
| `bench-cliente-medidas.mjs` | **88/88** | **PASSA** |
| `bench-cliente-clube.mjs` | **99/99** | **PASSA** |
| `bench-cliente-cupons.mjs` | **76/76** | **PASSA** |
| `bench-cliente-dados.mjs` | **85/85** | **PASSA** |
| `bench-cliente-seguranca.mjs` | **99/99** | **PASSA** |
| `bench-cliente-afiliada.mjs` | **100/100** | **PASSA** |
| `bench-cliente-auditoria.mjs` | **38/38** | **PASSA** (a da Fase 2 inteira) |

`bench-cliente-nav.mjs` cobre a fundacao e a casca: os 9 itens de `NAV_ITEMS`,
os 8 atalhos de `CONTA_ATALHOS`, `isActiveSlug` (com a contraprova do
`startsWith` naive), `saudacao`, o veredito de validade do cupom nos dois lados
da virada do dia, a pureza de `metrics.ts`, a ponte de dados com o Admin, os
dois componentes de navegacao renderizados e a geometria da casca.

`bench-cliente-conta.mjs` cobre o Dashboard (modulo 4): os numeros do print um
por um, a projecao do pedido com a ponte id-a-id para o array do Admin, a regra
do nivel VIP, os DOIS mapas de rotulo de status, os componentes renderizados
(com e sem dado) e o teto de contexto (sem banco, sem supressao de tipo).

`bench-cliente-login.mjs` cobre o Login (modulo 3): a transcricao do
`CustomerLogin.tsx` declaracao por declaracao (placeholders, `type="email"`, as
duas frases do olho, os rotulos dos dois modos), a bateria de validacao nos DOIS
sentidos (aprova o caso bom, recusa cada caso ruim), o aviso nas duas cores, a
PORTA (que a area aparece sem sessao, que `Sair` fecha e `entrar` reabre, que ela
nasce aberta como o print `cli-001`) e a honestidade (nenhuma rede, nenhum
provedor, a senha so no `useState`).

`bench-cliente-pedidos.mjs` cobre `Meus Pedidos` (modulo 5) em tres camadas,
porque a tela tem tres referencias: a transcricao do `conta.pedidos.tsx` (o
accordion, os seis estados, o vazio), a PONTE de dado (os cinco codigos e totais
do print, o `me:1` cru, o sexto pedido que NAO pode aparecer, o campo aditivo que
o admin nao le) e o RENDER do cartao fechado e aberto. Inclui a **prova negativa**
dos dois blocos de rastreio: as duas condicoes do original sao reimplementadas e
rodadas contra o dado do print, provando que elas dao `false` — os blocos nao
apareceriam em nenhum dos cinco cartoes.

`bench-cliente-favoritos.mjs` cobre `Favoritos` (modulo 6) em quatro camadas: a
transcricao do `conta.favoritos.tsx` (o titulo curto, a frase e o botao do vazio,
os dois botoes do cartao), o DADO (a lista nasce vazia por decisao, e a ponte
devolve copia), o RENDER (o desenho do vazio item a item, o cartao da grade) e a
**prova da TINTA** — que a tela nao escreveu `beige`, o token que o material
desmente (interior branco puro no print) e que este projeto nem tem.

`bench-cliente-enderecos.mjs` cobre `Enderecos` (modulo 7) em OITO camadas, e e
a maior bancada da area ate aqui: a transcricao do `conta.enderecos.tsx` (20
declaracoes), o cabecalho PROPRIO (que esta tela nao usa o `ClientPageHeader`, e
por que), o **FORMULARIO montado de verdade** — e o unico componente desta area
que o `renderToStaticMarkup` consegue montar sem efeito —, o DADO (a lista vazia
e a ORDEM, testada inserindo dois enderecos e conferindo que o principal vem
primeiro, com restauracao), o desenho do vazio e do cartao por fonte, a TINTA, a
HONESTIDADE (as tres escritas devolvendo `ok: false` com motivo, e a ausencia da
consulta de CEP por `viacep`) e seis provas ao contrario. A prova mais forte e a
do formulario: ele e renderizado com `initial: null` e com um endereco sintetico,
e o HTML e conferido — os 10 rotulos, os 5 `required`, o preenchimento a partir
do `initial`, os placeholders e a ausencia de `value="null"`.

`bench-cliente-medidas.mjs` cobre `Minhas Medidas` (modulo 8) em DEZ camadas: a
transcricao do `conta.medidas.tsx` (as 6 medidas batendo chave/rotulo/unidade/ORDEM
com o `FIELDS` do original, os 6 tamanhos, as opcoes dos dois selects), o cabecalho
PROPRIO (a MESMA situacao de `Endereços`: sem `ClientPageHeader`, corte em `md`), o
formulario por fonte (a grade `grid-cols-2 sm:grid-cols-3`, o condicional `Há quanto
tempo?`, a limpeza do tempo ao marcar `Não`), a **celula do historico montada de
verdade** — a prova central: `CelulaValor` com `59` sai `59 kg`, e com `null` sai
VAZIO (o `null` NAO pode virar `null`/`0`/`undefined`) —, o **botao sim/nao por
RENDER** (o texto nao muda com o estado; so a classe, `bg-foreground` aceso contra
`bg-secondary` apagado, com a FORMA `h-12 flex-1` fixa), o DADO (o perfil 165/59/28
dos prints, os tres vazios como `null`, o historico vazio, e a ORDEM do historico
testada inserindo dois registros com restauracao), a TINTA (o `beige` do original
convertido para a familia `secondary`, e o bloco vazio sem fundo), a HONESTIDADE
(`salvarPerfilMedidas` devolvendo `ok: false`, a validacao dos tres obrigatorios, o
`reason` exibido), o CONTRATO dos dois tipos com os nomes de coluna, e **dez provas
ao contrario**.

`bench-cliente-clube.mjs` cobre `Clube VIP & Cashback` (modulo 9) em DEZ camadas:
a transcricao do `conta.pontos.tsx` (22 declaracoes, incluindo as DUAS frases
interpoladas — `Faltam N pontos` e `pontos para você se tornar` —, provadas por
pedaco literal mais o render), o cabecalho PROPRIO (a MESMA situacao de
`Endereços` e `Medidas`: sem `ClientPageHeader`) e a TAG `h2` no lugar do `h1` do
original, o cartao escuro (a faixa `borderTop: 8px solid` medida em 8 px de 1x, a
barra `h-2`/`progressoPct`, o ramo `Nível Máximo Atingido!`), a **prova central do
sinal** (secao 4), o **cartao de recompensa nos DOIS estados** — o material so
mostra o BLOQUEADO, entao o ramo `Resgatar Agora` existe apenas por RENDER —, o
DADO (saldo 0, acumulado 0, `Bronze`, proximo `Prata`, faltam 1000, barra 0%; os 4
niveis na ordem do print, as 3 recompensas 500/1000/2000, as regras 100/50), a
igualdade do `Bronze` por IDENTIDADE de referencia entre as duas telas, a
HONESTIDADE (`resgatarRecompensa` devolvendo `ok: false` com o `PENDING_REASON`, e
a tela mostrando o motivo), o CONTRATO de `ResumoClube` com a nota do efeito duplo,
e **nove provas ao contrario**.

`bench-cliente-cupons.mjs` cobre `Cupons` (modulo 10) em DEZ camadas: a
transcricao do `conta.cupons.tsx` (as seis frases declaradas, as DUAS causas do
`disabled` — `expired` e `exhausted` —, e o filtro `is_active` provado nos DOIS
originais ao mesmo tempo, o da lista e o do dashboard), o cabecalho PROPRIO (o
`<header>` com `h2` de `font-serif text-3xl` e o `mt-1` da descricao), as QUATRO
conversoes da tinta `beige` — cada uma com o seu `/NN`, para a prova nao passar
com a tinta trocada — e a caixa vazia provada SEM fundo, o **cartao montado nos
DOIS estados** (a prova mais forte do arquivo: o print `cli-015` so mostra o
FECHADO, com `opacity-60 grayscale` e o botao `disabled:hidden`; o ramo ABERTO,
com `hover:border-foreground/30` e o botao visivel, nao tem print nenhum), os
dois recortes `size-6`/`-left-3` com a medida do `cli-015`, a **medida que decide
o termo `Mínimo:`** (secao 6), a validade com a virada do relogio dos dois lados
do `23:59:59`, a copia (o `writeText` do codigo, o `?.` e o `.catch` do contexto
nao seguro, o aviso `Cupom CLOSET10 copiado`), o CONTRATO (`CupomCliente` com os
seis campos, a ausencia do tipo `Coupon` do admin) e **nove provas ao contrario**.

`bench-cliente-dados.mjs` cobre `Dados da Conta` (modulo 11) em DEZ camadas: a
transcricao do `conta.dados.tsx` (as oito frases declaradas, os DOIS textos
longos dos cartoes laterais — comparados literais, e nao por pedaco —, o
`placeholder` do telefone e o `type="email"` presentes nos DOIS arquivos), o
cabecalho PROPRIO, as duas conversoes de `beige` **com a medicao que as
sustenta** (as quatro caixas que o original pinta medem branco puro no print),
a **geometria medida** — que e a prova mais forte do arquivo, porque cada uma das
dez medidas distingue DUAS declaracoes plausiveis e nao apenas "esta perto" —, o
`CampoDados` **MONTADO** (o `placeholder` como atributo, o `type="email"` com o
valor, o `type="text"` de reserva, o `mt-1.5`, a forma `<label>`+`<span>`+
`<input>`, e o campo controlado por `value` e nao `defaultValue`), o `CartaoAviso`
**montado nos DOIS estados** (a prop `comFundo` e a unica decisao binaria do
modulo, e o print so mostra um dos estados), o formulario campo a campo na ordem
do print, a saida do estado `saving` **com a classe de aparencia preservada**, a
escrita e a regra do e-mail (o aviso que muda, a comparacao contra a CONTA e nao
contra o campo, e a razao pela qual a tela NAO atualiza o proprio `conta`), a
rota/o menu/o icone, e **oito provas ao contrario**.

### O termo `Mínimo:` — a medida do print corrigiu uma invencao

O campo `minimo` do cupom da cliente nasceu com **`150`** na fundacao do modulo
(por volta do modulo 4) e **nao tinha fonte nenhuma**. A bancada do modulo 10
reprovou a invencao, e duas fontes independentes dizem ZERO:

- **`adm-012`** (a lista de cupons do admin) imprime `—` na coluna `MÍN.` do
  `CLOSET10`. O proprio original do admin escreve
  `Number(r.min_subtotal) > 0 ? formatBRL(...) : "—"` — ou seja, `—` **e** o zero.
  Um alvo de R$ 150 imprimiria `R$ 150,00`, e o print nao mostra isso. O
  formulario de cupom do admin (`adm-013`) abre com `min_subtotal: 0`.
- **`cli-015`** (esta tela) tem DOIS termos na linha de meta, `EXPIRA EM:
  20/08/2026` e `EXPIRADO`. A medida fecha a questao: a banda de tinta (y 628..658)
  vai de **x=383 a x=598**, dentro de um cartao que vai de x=350 a x=1404, e o
  UNICO vazio largo e **522..541** — os 16 px do `gap-4` do original. Os demais
  intervalos medem 2 a 6 px, que sao os espacos DENTRO das palavras. Nao ha tinta
  nem espaco para um terceiro termo.

O ramo `Mínimo:` continua no codigo — `min_subtotal` e coluna real de `coupons` e
o admin a edita — mas ele so desenha quando o valor passa de zero, e a bancada
prova os DOIS lados: com `150` o termo aparece (`Mínimo: R$ 150,00`), com `0` ele
some. A prova de contraste e a mesma que reprovou o dado antigo.

### Esta bancada reprovou a coisa certa na PRIMEIRA rodada

`74/75` na primeira execucao, e a unica falha era o dado inventado (`minimo:
150`). O instrumento nao estava cego — ele estava medindo exatamente o campo que
nao tinha fonte. O conserto foi no DADO (a nota de `DEMO_CUPONS_CLIENTE` agora
carrega as duas provas do zero), e a bancada passou a `76/76` com duas provas a
mais: as duas que garantem que o termo do minimo nao e constante.

### A forma do cupom: o `overflow-hidden` e o recorte de fora

O cartao tem DOIS circulos decorativos, um em cada ponta, deslocados `-left-3` /
`-right-3` (12 px para fora) e cortados pelo `overflow-hidden` do container. A
medida do `cli-015` confirma o `size-6`: a tinta do circulo esquerdo vai de
**x≈344 a x≈363**, e o cartao comeca em **x=350** — 6 px de tinta para fora da
borda, que e exatamente a metade de um circulo de 24 px deslocado de 12 px. Um
`size-8` deixaria 10 px para fora; um `-left-2` (8 px), 4 px. A forma esta travada
por medida, e nao por semelhanca.

### A copia aqui COPIA, e no dashboard nao — a diferenca e concreta

O cartao do dashboard tem uma seta que NAO copia (nota em
`cupons-ativos-card.tsx`). Aqui o botao copia de verdade, e a razao nao e
capricho: `navigator.clipboard.writeText` e **API do navegador**, e nao
persistencia. Nao ha banco nessa operacao, entao copiar o codigo funciona hoje,
sem Neon, e o aviso `Cupom CLOSET10 copiado` confirma um fato que ACONTECEU — o
oposto do `Endereço salvo`, que afirmaria uma gravacao que nao houve.

Os dois detalhes que fazem a copia nao quebrar em http: `navigator.clipboard?.` e
o `.catch` vazio na promessa. `clipboard` e `undefined` fora de contexto seguro, e
o `writeText` rejeita — sem os dois, a pagina servida por http viraria erro nao
tratado. A bancada prova os dois.


### O instrumento reprovou a coisa certa DUAS vezes nesta bancada

A primeira rodada de `bench-cliente-medidas.mjs` deu `83/85`, e as duas falhas
eram do INSTRUMENTO, nao da tela — o mesmo tipo de defeito do modulo 7, agora em
dois pontos:

1. **O botao de salvar.** A bancada procurava o literal `Salvar Perfil de
   Medidas` no original, que escreve `SALVAR PERFIL DE MEDIDAS` em CAPS. O projeto
   (como `Salvar Endereço` em `addresses-view`) escreve em caixa natural e usa a
   classe `uppercase`. O TEXTO RENDERIZADO e o mesmo; a comparacao de literal nao.
   O remendo foi comparar os dois lados em CAIXA ALTA — a prova passa a medir o que
   o olho ve, e um `uppercase` ausente continua sendo pego por uma prova separada.
2. **A nota de transacao.** A bancada lia `data.ts` com `semComentarios()` — que
   **remove comentarios** — e procurava a nota que diz que o `upsert` do perfil e o
   `insert` do historico tem que caber na MESMA transacao. A nota estava la; o
   instrumento a tinha apagado antes de ler. O remendo foi ler o arquivo CRU para
   as provas de nota, e manter a versao sem comentarios para as de codigo.

Licao, a mesma do modulo 7 em outra roupa: **um `fail` de bancada nao diz "a tela
esta errada", diz "alguma coisa nao bate" — e antes de mexer na tela, confira se o
instrumento realmente mediu o alvo.** Aqui a tela estava certa nas duas vezes.

### A PROVA CENTRAL deste modulo: o sinal da linha = o sinal do saldo

`MovimentoPontos.pontos` NAO e sempre positivo. Em `adjustment` o sinal vem NO
PROPRIO NUMERO — e a prova esta na linha do original: `(p.type === 'adjustment' &&
p.points > 0)`. Se `points` fosse sempre positivo, esse `> 0` nunca seria falso e
o teste nao existiria.

O SALDO do original faz `acc + (entra ? p.points : -p.points)`. Com um ajuste de
`-50`, `entra` e `false` e a expressao vira `-(-50)` = **+50**: o ajuste que devia
TIRAR pontos ACRESCENTA. E um duplo negativo, e ele passa calado porque o unico
extrato do material esta vazio.

A secao 4 monta um extrato de quatro linhas — `earn +500`, `redeem 200`,
`adjustment +100`, `adjustment -50` — e prova tres coisas de uma vez:

1. O SALDO e **350** (`500 − 200 + 100 − 50`). A conta do original daria **450**,
   e o numero esta escrito na prova: e ele que separa o certo do defeito.
2. A LINHA do ajuste negativo sai com `-` em `text-danger` — e nunca com `+500`
   verde.
3. As duas usam **o MESMO SIMBOLO** (`entradaDePontos === metrics.movimentoEntra`).
   Nao e "comportamento igual": e o mesmo objeto. Duas copias equivalentes
   passariam na prova hoje e divergiriam no primeiro ajuste que uma recebesse.

A correcao exigiu `movimentoEntra` e `magnitudePontos` em `metrics.ts` (com o
`Math.abs` que impede o sinal de ser aplicado duas vezes) — e a bancada foi quem
reprovou: a primeira rodada deu `83/89` com as tres provas do sinal vermelhas.

### Tres falhas de INSTRUMENTO nesta bancada (e uma delas era da tela)

A primeira rodada deu `83/89`. As seis falhas tinham DUAS causas diferentes, e a
distincao importa:

1. **A conta do saldo e as duas provas da linha (3 falhas) eram da TELA.** A tela
   chamava a regra do original (`type === 'earn' || type === 'bonus'`, sem o
   ramo do `adjustment` positivo) E somava `-movimento.pontos` sobre um valor ja
   negativo. Duplo erro, duplo sinal. Aqui a bancada reprovou a coisa ERRADA —
   o caso oposto do modulo 8.
2. **`Seu Saldo` (1 falha) era do INSTRUMENTO** — o mesmo defeito do botao de
   `SALVAR PERFIL DE MEDIDAS` no modulo 8, em tamanho menor: eu havia escrito
   `Seu saldo` no arquivo, o original escreve `Seu Saldo`, e as duas grafias
   renderizam identico por causa do `uppercase`. Nao era defeito — era a terceira
   ocorrencia do padrao nesta area. A prova passou a comparar MAIUSCULIZADO, que
   e o que o olho ve.
3. **As duas caudas das regras (2 falhas) tambem eram do INSTRUMENTO, e por
   quebra de linha.** A bancada procurava a frase `pontos após a primeira compra.`
   INTEIRA no arquivo, e o Prettier da tela quebra a linha no meio dela — o
   fragmento existe no TEXTO RENDERIZADO e nao existe no ARQUIVO. Mesma familia de
   `feedback_bancada_comentario_vira_falso_positivo`: **o alvo era o render, e o
   instrumento media o arquivo.** O remendo foi escrever as frases numa linha so
   na tela (o Prettier as mantem) — e vale registrar que a alternativa (quebrar a
   prova em pedacos) teria escondido justamente o que a prova existe para pegar.

### Nota sobre a contagem `ok` das bancadas

Nas bancadas deste repositorio `provas` so e incrementada dentro de `ok()` — um
`fail()` nao soma. Entao uma execucao **com falha mostra um denominador menor**
(ex.: `39/41`), e o numero de `ok` cai junto. Nao e bancada perdendo prova: e o
contador refletindo. A leitura correta de uma regressao e a diferenca no TEXTO
das provas (`diff` da lista), e nao a variacao do total.

### Nota de tempo de execucao

`createProgram` do TypeScript leva de 30 s a 80 s conforme o cache de disco do
ambiente, e as duas bancadas fazem emissao propria. Com o cache frio a bancada
passa de 178 s (o teto do shell) e o `timeout` mata o processo **sem saida** —
parece falha e nao e. O `bench-cliente-conta.mjs` tem `BENCH_TRACE=1`, que grava
`_bench-conta.log` com o tempo de cada etapa; e assim que uma execucao morta por
tempo diz ONDE parou, em vez de deixar so a ausencia de saida.

## Typecheck

- Ultimo: **`EXIT=0`** (projeto inteiro, `tsc --noEmit -p tsconfig.json`),
  rodado depois do modulo 11 (`account-view.tsx`, `dados/page.tsx`, o `telefone`
  em `types.ts`, o `salvarDadosConta` em `data.ts`, e as duas chaves
  compartilhadas — `--placeholder` em `globals.css` e a chave `placeholder` em
  `tailwind.config.ts`).
- Sem `any` artificial, sem `@ts-ignore`, sem `@ts-expect-error`, `strict` intacto.

## Build

- Nao rodado nesta fase (somente na validacao global final).

## Correcao de medicao (modulos 1 e 2)

A leitura de escala das capturas foi **refeita** e mudou a geometria entregue.

**A captura esta em 1x.** A soma `12 + 260 + 40 + 2212 + 12 = 2536` **fecha** — as
quatro bordas dos cartoes aparecem pela cor `--border` (233,227,223) em x = 10,
269, 310 e 2522 — mas ela so mede as LARGURAS em pixel do arranjo; **nao** diz o
fator de escala. O fator quem diz sao as medidas contra as classes que o original
declara, e as tres apontam para 1x:

- A coluna de navegacao ocupa **259 px de pixel** (borda esquerda em x=9, direita
  em x=268). Isso e o `260px` que o original declara em `lg:grid-cols-[260px_1fr]`
  **lido direto** — em 2x seriam 520 px de pixel.
- A pilula ativa (`Meus Pedidos`) mede **29 px de altura** de tinta (y 291..311 na
  `004603`). `py-3.5` (28 px) + `text-sm` (20 px) da ~38 px de CSS; a tinta da
  maiuscula fica dentro disso. Em 2x a tinta teria ~76 px.
- O coracao do estado vazio mede **30 x 27 px** de tinta; o original declara
  `h-8 w-8` (32 px). Em 2x seriam 64 px.
- O raio do canto do bloco tracejado mede **~26 px** (a borda de cima comeca em
  x=376, y=63 e chega na vertical em x=350, y=88). O original declara
  `rounded-[2rem]` (32 px). Em 2x seriam 64 px.

Ou seja: as classes que a tela ja entrega estao **certas pelo motivo certo** — o
original declara em px de CSS e a captura mostra esses mesmos numeros em pixel.
A conclusao anterior (2x) tirava da soma de larguras um fator que ela nao mede.

O que mudou por causa disso:

- **Teto de largura removido.** A casca tinha `max-w-shell` (1600 px). O
  original declara `container mx-auto px-3 sm:px-4 … max-w-full`, e o print nao
  mostra deslocamento da coluna — ela comeca no primeiro pixel do recuo. Trocado
  por `max-w-full`, e as laterais corrigidas de `px-4 sm:px-6` para
  `px-3 sm:px-4`, que e o que o original declara.
- **Recorte de estouro trocado para `overflow-x-clip`.** O original usa
  `overflow-x-hidden`, mas isso cria container de rolagem e mata o `sticky
  top-28` da coluna de navegacao — sem erro nenhum no console. `clip` recorta
  igual e preserva o `sticky`.
- **Padding horizontal do cartao da coluna zerado** (`p-3 … px-0`): a borda do
  cartao e a pilula ativa comecam no MESMO x no print, entao o `p-3` horizontal
  do original nao pode estar la.
- **Cabecalho da loja sem `max-w-[1600px]`**: medido em `cli-001`, o conteudo vai
  de x 517 a 2011, centrado em 1264 — o centro da imagem e 1265. O que governa e
  a centralizacao, nao um teto.
- **Menu do cabecalho `md:hidden`**, nao `lg:hidden`, e logo `text-xl md:text-3xl`:
  sao as classes do original. Com `lg:hidden` a faixa entre `md` e `lg` ficaria
  sem menu E sem categorias.
- **O bloco `[data-cliente-area]` do `globals.css` foi removido** — ver abaixo.

Nada disso e inferencia: cada valor foi conferido contra o que o original
declara, e a secao 9 da bancada passa a exigir os quatro pontos (teto ausente,
`clip` no lugar de `hidden`, soma da geometria fechando, cabecalho sem teto).

## Divergencias registradas

1. **Rotulo de `novo`.** O print do cliente imprime `AGUARDANDO PAGAMENTO`; o
   painel admin pinta o mesmo estado como `NOVO`. O cliente usa o rotulo da
   PROPRIA referencia, sem tocar no admin. **No cartao `Ultimo pedido` do
   dashboard o selo mostra o codigo CRU (`NOVO`)** — e o que o original escreve
   ali (`{last.status}`) e o que o print `004603` mostra. Os dois comportamentos
   coexistem no material e os dois foram reproduzidos, cada um no seu lugar.
2. **`Afiliada` e atalho, nao item de sidebar.** O print `cli-001` a mostra na
   grade de atalhos do dashboard; a sidebar do `cli-019` nao a tem. As duas
   listas existem separadas em `nav.ts` por isso.
3. **`Looks` nao entrou.** `conta.looks.tsx` existe no original, mas nenhum
   print tem o item nem a tela. Arquivo nao e referencia de interface.
4. **`overflow-x-hidden` do original virou `overflow-x-clip`** (acima): e
   conversao de INTENCAO, nao desvio. O efeito pedido (recortar o estouro
   horizontal) e o mesmo; o efeito colateral que o original carrega (matar o
   `sticky` da propria coluna) nao foi reproduzido de proposito.
5. **Icone de `Meus Dados` diverge entre a coluna e o atalho.** A sidebar usa
   `UserCog` (`AccountLayout.tsx` linha 27); o atalho do dashboard usa
   `Sparkles` (`conta.index.tsx` linha 90). Nao foram igualados: o material tem
   os dois, e igualar seria o "conserto" errado. A bancada exige a DIFERENCA.
6. **O verde do aviso de sucesso diverge do print, e a escolha foi pelo token.**
   O aviso `Bem-vinda de volta!` do print `cli-001` foi medido: fundo
   `(236,253,243)`, tinta `(0,138,46)` — matiz **~140°**. O token de sucesso do
   projeto, `--success`, e **162°** (`#00BC7D`, verde-agua). Sao verdes
   DIFERENTES. O aviso usa `--success` de proposito: e o verde de sucesso que o
   projeto inteiro ja usa (o admin incluido), e inventar um segundo verde so para
   este aviso criaria uma cor que existe num lugar e em nenhum outro. Trocar o
   token para casar com este print mudaria o admin, que esta encerrado.
7. **`Sair da conta` agora LEVA ao formulario, e nao a um aviso no lugar.** Numa
   rodada anterior ele so mostrava a linha `Sair ainda não encerra sessão…`
   abaixo do conteudo. Com o portao do modulo 3, `Sair` passou a ter para onde
   ir — e o aviso de honestidade foi MOVIDO para a tela de entrada (o mesmo
   texto, agora sob o formulario), onde ele de fato importa: e ali que alguem
   poderia achar que `ENTRAR` autentica. A frase foi ampliada para
   `Entrar ainda não encerra sessão nem cria uma: …`, porque a partir daqui ela
   precisa cobrir as DUAS pontas. A bancada da casca continua exigindo a frase; a
   do login passa a exigir tambem.
8. **O verde do desconto e o `--danger` do projeto, e nao o `rose-600` do
   original.** A linha `Desconto:` do painel usa `text-rose-600` no original — a
   paleta crua do Tailwind, que este projeto nao usa. O token escolhido e
   `--danger`, a **mesma** conversao que o projeto ja fez para os tons de rosa do
   original: em `lib/pedidos/demo.ts`, o status `cancelado` (`bg-rose-100
   text-rose-800`) tambem virou `danger`. Inventar um segundo mapeamento para o
   mesmo rosa seria a divergencia.
9. **Os dois blocos de rastreio nao existem na tela** — e a prova esta na secao
   acima. Registrado aqui porque um leitor futuro pode achar que faltou
   transcrever; nao faltou: com o dado do print, o original tambem nao os desenha.
   Junto vem a pendencia: quando o banco tiver `tracking_url`, `delivery_status` e
   `delivery_tracker_url`, os dois blocos entram — no ramo que o formato do
   identificador entao provar.
10. **O titulo de `Favoritos` e curto na tela e longo na coluna.** A tela escreve
   `Favoritos`; a coluna escreve `Meus Favoritos`. Os dois existem no material
   (o `<h2>` de `conta.favoritos.tsx` e o item do `AccountLayout`), e o print
   `004717` mostra os dois ao mesmo tempo. Nao se igualou: igualar seria apagar um
   dos dois rotulos que a referencia mostra.
11. **`bg-beige` virou `bg-secondary` / ausencia de fundo.** O original declara
   `bg-beige/5` na caixa e `bg-beige/20` no circulo. O print mostra BRANCO PURO
   nos dois, `--beige` nao existe neste projeto, e a 5% a tinta do original seria
   (255,254,254) — invisivel. A caixa fica sem fundo e o circulo usa
   `bg-secondary/40` (mesmo 95% de luminosidade). E a mesma conversao que o
   `Stat.tsx` do admin ja registra; a FORMA e transcrita, a tinta nao se inventa.
12. **A consulta de CEP por `viacep` nao entrou** (a divergencia do modulo 7). O
   original, ao completar 8 digitos no CEP, faz `fetch` em
   `https://viacep.com.br/ws/.../json/` e preenche rua/bairro/cidade/UF. Esta fase
   tem o invariante "a area do cliente nao faz rede" (provado em todas as
   bancadas), e o formulario ainda NAO grava — entao o auto-preenchimento seria
   cosmetico sobre um salvamento que nao acontece. O campo CEP continua, MANUAL.
   Registrado como pendencia: quando o Neon entrar, a consulta volta (e entao
   passa a ter onde cair). **Nao e um fetch adiado — e um fetch que nao deve
   existir enquanto nao ha o que preencher.**
13. **O `window.confirm` de exclusao do original nao entrou.** O original pede
   `confirm("Excluir este endereço?")` antes de apagar. Aqui a exclusao nao grava
   (nao ha banco), entao um dialogo de confirmacao seria uma pergunta para uma
   acao que nao acontece — pior que inutil, enganoso. A acao AVISA que nao ha
   persistencia, e a pergunta volta junto com o banco. Mesma familia da divergencia
   12: uma peca cuja funcao depende de um efeito que ainda nao existe.
14. **Os rotulos `cli-006`/`cli-007` estavam trocados** (corrigido neste modulo).
   O codigo dos modulos 6 e 7 citava `004717` como `cli-006` e `004726` como
   `cli-007`. O `MAPA-CLIENTE.md` sempre esteve certo: a numeracao `cli-NNN`
   segue a ORDEM DO NOME DO ARQUIVO, entao `004709`=**cli-006**, `004717`=**cli-007**,
   `004726`=**cli-008**. Conferido contra os PIXELS, e nao pelos rotulos: `004709`
   e o quadro largo com a barra de URL `/conta` no canto inferior esquerdo (topo
   da tela); `004717` e o mesmo cartao vazio ja ROLADO (a coluna termina em `Sair
   da conta` no topo da captura, e o rodape `@closetlunar` ja aparece). Os dois
   mostram Favoritos — mas so o primeiro e o topo. **Os numeros de ARQUIVO nas
   bancadas nunca estiveram errados** (a busca e por numero); o que estava errado
   era a etiqueta ao lado. Nove citacoes corrigidas em `favorites-view.tsx`,
   `addresses-view.tsx`, `demo.ts` e nos dois benches. Um lembrete de que o
   rotulo engana e o pixel nao — exatamente a regra que ja vale para o `cli-NNN`
   contra o arquivo, e que agora vale tambem para `cli-NNN` contra si mesmo.
15. **O `bg-beige` do formulario de medidas virou `secondary`, e o bloco vazio
   do historico ficou SEM fundo** (a divergencia do modulo 8, filha da 11). O
   original de `conta.medidas.tsx` pinta QUATRO pontos de beige — os 6 campos e
   os 2 selects (`bg-beige/10`), o bloco vazio (`bg-beige/5`), o `thead` da tabela
   (`bg-beige/20`) e a linha (`hover:bg-beige/10`). A conversao e a mesma das
   telas anteriores: campos e `thead` para a familia `secondary` (mesma
   luminosidade), e o bloco vazio sem fundo (a 5% o material mostra branco puro).
   Nenhuma tinta nova foi inventada.
16. **A estrelinha do `Vantagens VIP` e `amber-600`, e nao o `amber-500` do
   original.** O original escreve `<Sparkles className="h-4 w-4 text-amber-500" />`.
   A area da cliente usa `text-amber-600`, o amber **medido** no KPI do Dashboard
   (a bancada de `conta` mediu a mediana `(228,124,20)` = `amber-600` no print
   `004603`). Usar `500` aqui e `600` ali poria DOIS ambers no mesmo painel, para
   o mesmo papel (icone de destaque em amarelo), quando nenhum print mostra a
   diferenca de tom. A escolha e o amber medido, e a divergencia fica registrada —
   o mesmo criterio do verde (divergencia 6) e do rosa (divergencia 8): **um tom
   por papel, o medido, e nao um segundo tom inventado a partir do original.**
17. **O botao `VER NO AVATAR 3D` existe mas NAO abre o Provador.** O original o
   liga a `openFitting()` de `@/components/site/FittingRoomContext` — um
   componente do SITE, fora desta fase. O botao e um ALVO (desenhado, sem
   `onClick`), como os botoes de carrinho de `Favoritos` e os dois de rastreio de
   `Meus Pedidos`. Criar um Provador local agora seria a SEGUNDA implementacao do
   mesmo conceito (proibido). Pendencia: a ligacao entra junto com o modulo
   `Provador e IA` da Fase 6, quando o contexto do site existir.

18. **O SINAL do ajuste negativo: o saldo do ORIGINAL esta errado, e esta tela
   nao reproduz o defeito.** `MovimentoPontos.pontos` nao e sempre positivo: em
   `adjustment` o sinal vem no proprio numero — e a linha do original prova
   (`p.type === 'adjustment' && p.points > 0`). O saldo do original faz
   `acc + (entra ? p.points : -p.points)`; com um ajuste de `-50`, `entra` e
   `false` e a expressao vira `-(-50)` = **+50** — o ajuste que devia TIRAR pontos
   ACRESCENTA. E um duplo negativo, invisivel porque o unico extrato do material
   esta vazio. Aqui o tipo decide se entra e a magnitude (sempre positiva) decide
   quanto: `movimentoEntra` + `magnitudePontos` em `metrics.ts`, chamadas pela
   MESMA funcao no saldo e na linha do extrato. A bancada prova o numero: a conta
   certa da **350**, a do original daria **450**.
19. **O `onClick` do `Resgatar Agora` existe, e o original o OMITE.** O original
   declara o botao so com `disabled={!canAfford}` — nao ha `onClick`. Transcrever
   a omissao deixaria um botao que parece acionavel e nao faz nada, que e o
   defeito que esta fase existe para nao repetir. Aqui ele chama
   `resgatarRecompensa()`, que devolve `ok: false` com o motivo, e a tela o
   mostra. O ramo de SUCESSO tambem foi escrito (`{rotulo} resgatada`) — ele nao
   aparece em print nenhum, mas existe no codigo, e a bancada o exige.
20. **O titulo da tela e `h2`, e nao o `h1` do original.** `/conta/pontos` e o
   UNICO print da area da cliente em que o titulo da tela e `<h1>` (o Dashboard
   nao tem cabecalho; a casca gasta o `<h1>` na saudacao). O projeto usa `<h2>`
   em todas as telas desta area e no `ClientPageHeader`. Como `/conta/pontos` e
   `/conta` nunca renderizam juntas, nao ha dois `<h1>` em momento nenhum.
   Divergencia de TAG, sem efeito no pixel.
21. **A cor dos QUATRO niveis e demonstracao; em producao vem da coluna `color`.**
   `DEMO_NIVEIS_CLUBE` guarda `#CD7F32` (Bronze), `hsl(0 0% 75%)` (Prata),
   `#F0D000` (Ouro), `#B0F0F0` (Diamante). As medidas foram feitas na TINTA do
   trofeu de cada linha do `cli-013` — os pixels carregam gradiente, entao
   Prata/Ouro/Diamante sao APROXIMACOES. O Bronze NAO e: ele foi recorrigido
   para `#CD7F32` a partir da FAIXA SOLIDA do topo do cartao do `cli-012`
   (`borderTop`, linhas 414-421, medidas em (205,127,50)), que e a cor pura. A
   licao e a mesma do modulo 4: **a mediana da tinta de um TEXTO sai mais escura
   que a cor solida** — medir a faixa, nao a palavra. O valor anterior
   (`hsl(33 72% 44%)`) vinha da palavra `BRONZE` e estava contaminado.
22. **O `minimo` do cupom da cliente era `150` sem fonte, e virou `0`.** O campo
   nasceu inventado na fundacao do modulo 4. Duas fontes independentes dizem
   ZERO: o `adm-012` imprime `—` na coluna `MÍN.` do `CLOSET10` (e `—` e como o
   original do admin escreve o zero), e a linha de meta do `cli-015` tem DOIS
   termos — a medida fecha a questao (tinta de x=383 a x=598, um unico vazio de
   18 px, nada mais cabe). O ramo `Mínimo:` continua no codigo porque
   `min_subtotal` e coluna real de `coupons`; ele so desenha quando o valor passa
   de zero. Ver a secao "O termo `Mínimo:`" acima.
23. **A SETA do cartao do dashboard NAO copia aqui, e o botao DESTA tela copia.**
   No ORIGINAL os dois copiam — o dashboard com `toast.success("Cupom copiado!")`
   e esta tela com `toast.success(\`Cupom ${code} copiado\`)`. No projeto, o
   cartao do dashboard ficou sem copia no modulo 4 (a seta virou `Link` para a
   lista), e a nota de `cupons-ativos-card.tsx` registra a decisao. AQUI a copia
   foi transcrita porque `navigator.clipboard` e API do NAVEGADOR, e nao
   persistencia: copiar funciona hoje, sem Neon, e o aviso confirma um fato que
   ACONTECEU — o oposto do `Endereço salvo`, que afirmaria uma gravacao que nao
   houve. Os dois botoes nao tem o mesmo rotulo acessivel no material: o desta
   tela carrega `aria-label="Copiar"` explicito (o `Copy` e um icone sem texto),
   e o do dashboard nao tem `aria-label` nenhum no original. O dashboard fica
   como esta — mudar um modulo encerrado sem que a fonte peca seria reabri-lo por
   gosto, e a pendencia dele ja esta registrada.
24. **O `h2` desta tela diz `Meus Cupons`, e a coluna do menu diz `Cupons`.** Os
   dois rotulos sao do material, e os dois convivem desde o modulo 1: o
   `nav.ts` guarda `NAV_ITEMS` (`Cupons`, a coluna) e `CONTA_ATALHOS`
   (`Meus Cupons`, o atalho do rodape) justamente por isso — e o `<h2>` da tela
   segue o do ATALHO, como o original. Nao ha divergencia a corrigir; o registro
   existe para a proxima tela nao achar que um dos dois esta errado.

25. **A tinta do `placeholder` e uma cor NOVA DESTE PROJETO, e nao do original.**
   O `conta.dados.tsx` nao declara `::placeholder` em lugar nenhum, e por isso o
   navegador usaria o proprio padrao — que sobre o branco puro do campo daria por
   volta de (117,117,117), herdando o `color` com opacidade. O print `cli-017`
   mede (137,135,134) na tinta mais escura do glifo: um cinza NEUTRO, mais claro
   que o `--muted-foreground` (105,98,93) dos rotulos. Essa cor nao existia no
   projeto, entao ela entrou como token (`--placeholder`), e nao como "deixa o
   navegador decidir" — deixar o navegador decidir seria a unica cor da tela que
   ninguem escolheu. Isto e uma DIVERGENCIA em relacao ao original (que nao
   declara nada), e esta registrada como tal.
26. **A secao "Alteracoes em arquivos compartilhados com o Admin" mudou de
   NENHUMA para DUAS.** Ver a secao, que agora explica as duas e como as duas
   foram conferidas. Existe aqui porque uma secao que diz "nenhuma alteracao" e o
   registro mais perigoso de todos: ela faz a proxima fase parar de conferir.
27. **O `h2` desta tela diz `Dados da Conta` e o atalho do dashboard diz
   `Meus Dados`.** O mesmo caso da divergencia 24, e pelas mesmas razoes: os dois
   rotulos sao do material (`nav.ts` guarda `NAV_ITEMS` com `Dados da Conta` e
   `CONTA_ATALHOS` com `Meus Dados`), e nao ha o que corrigir.
28. **O icone desta tela e `UserCog` na coluna e `Sparkles` no atalho, e isso e
   do modulo 1, nao deste.** A bancada deste modulo CONFIRMA que a tela nao
   inventou um terceiro icone — a decisao continua sendo a de `nav.ts`. Nao foi
   reaberta.
29. **O `confirm()` do original virou uma faixa desenhada em estado.** O original
   usa `confirm("Encerrar todas as sessões? Você precisará entrar novamente.")` —
   uma caixa do sistema operacional. `confirm` NAO EXISTE em Node, entao
   reproduzi-lo derrubaria a bancada com `ReferenceError` no instante em que ela
   chamasse o encerramento; e nao ha instrumento nesta fase que verifique uma caixa
   bloqueante. A pergunta virou estado (`confirmando`), com o texto exato do
   original — PROVADO contra o original, por regex, e nao contra a minha memoria da
   frase — e com os dois rotulos que a caixa nativa oferecia (`Cancelar`/`OK`). O
   comportamento e o mesmo; o veiculo muda.
30. **O hover destrutivo usa `danger`, e nao o `rose-600` do Tailwind.** O
   original escreve `hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200`.
   O `--danger` do projeto mede (222,60,54); o `rose-600` do Tailwind mede
   (225,29,72). Sao vermelhos diferentes. Todas as areas do projeto ja usam
   `danger`/`danger-surface`/`danger-foreground` para acao destrutiva, e criar um
   segundo vermelho com o mesmo papel aqui faria a cor existir num lugar so. A
   FORMA do hover (fundo claro, texto e borda vermelhos) e a do original.
31. **As duas capturas parecem deslocadas uma em relacao a outra.** O painel de
   conteudo aparece em y=88 na `cli-019` e em y=86 na `cli-020`. A explicacao mais
   simples e recorte com margem diferente entre as duas, e nao movimento da pagina.
   As medidas internas de cada captura fecham entre si (967 = 1049 - 2 x 41), entao
   o deslocamento nao contamina prova nenhuma.
32. **O `Sair` da casca virou `async`.** Nao havia como a view consumir `sair` por
   contexto e o tipo continuar honesto para o futuro: encerrar sessao, quando houver
   servidor, sera assincrono. A implementacao de hoje continua so trocando um
   booleano; a ASSINATURA e que mudou. Mesmo movimento do modulo 11, onde a escrita
   nasceu `async` para caber o `await` que ainda nao existe.
33. **`AcessoConta` nao tem campo de senha — e a ausencia e a decisao.** O original
   le `pw`/`pw2` do estado do formulario e os manda direto para o
   `supabase.auth.updateUser`. Nao existe tipo de dominio por onde uma senha passe
   neste projeto, e `salvarSenha()` nao recebe parametro nenhum — a bancada prova a
   ARIDADE da funcao. Senha que nao entra em tipo nenhum nao tem como ser logada,
   persistida ou mostrada por engano.
34. **Esta tela NAO TEM PRINT — e por isso nao tem medida de pixel.** A regra de
   prioridade (`PRINT > ORIGINAL > ESTRUTURA > INFERENCIA`) tem o primeiro termo
   AUSENTE aqui: os vinte arquivos cobrem dez telas, e `Afiliada` nao e uma delas.
   A referencia prova apenas o ATALHO (`cli-001`). Todas as medidas da tela vem das
   CLASSES de `conta.afiliada.tsx`. Uma "prova de pixel" aqui seria uma medicao
   inventada — o defeito de `medir-janela-truncada`. Ver a "A tela sem print".
35. **O link de divulgacao: `window` do original virou PROP.** O original monta
   `` `${window.location.origin}/?ref=${slug}` ``. `window` nao existe em Node e
   derrubaria a bancada; e a demonstracao nao tem dominio que possa afirmar. A
   origem entra por prop e a demonstracao passa `''` — o que produz o caminho
   relativo `/?ref=<slug>`. A bancada prova os quatro ramos e prova, ao contrario,
   que sem slug NAO sai um `?ref=` sem valor.
36. **A paleta CRUA (`emerald`/`amber`) virou os tokens do projeto.** O original
   pinta `Saldo Total` de `text-emerald-600` e `A Receber` de `text-amber-600`. O
   projeto usa `--success` e `--warning`, como a area inteira e o admin. Mesma
   conversao da divergencia 30: a FORMA do original, a cor do projeto.
37. **O `Copiar` e o `Quero me cadastrar agora` existem e NAO agem.** Nao havia
   para onde ir: o link nao aponta para um site que exista e nao ha escrita de
   afiliacao. Os botoes ficam (estao no original e na referencia), mas nao FINGEM:
   o `Copiar` avisa que a copia entra na fase de integracao, e o do convite nao tem
   `onClick` — como o `VER NO AVATAR 3D` de Medidas. Dizer "copiado!" sem ter
   copiado nada seria a promessa que a REGRA DE HONESTIDADE proibe.

### A tela sem print, e o que a bancada se recusa a provar

Toda bancada desta area comeca medindo a captura: e a medicao que desempatou
rotulos (`Favoritos` contra `Meus Favoritos`), corrigiu espacos (o `mb-8` que foi
para dentro do cabecalho) e reprovou invencoes minhas (o `Mínimo:` do modulo 10).
Aqui nao ha captura.

Isso muda o METODO, e o metodo esta declarado no proprio arquivo de bancada, no
topo, antes de qualquer prova: **nao ha nenhuma medida de pixel neste arquivo.**
A tentacao era escrever as mesmas provas de geometria dos outros modulos usando as
classes do original como se fossem pixels medidos — e o resultado seria pior que a
ausencia, porque uma prova assim PASSA sempre (as classes sao minhas, e o
"esperado" seria deduzido delas). E o defeito de `feedback_medir_janela_truncada`:
o instrumento reporta AUSENCIA como sucesso.

O que sobrou para provar e mais fraco em APARENCIA e mais forte em FATO: as
funcoes puras, provadas contra o original. E — pela primeira vez na area — a
**prova de fonte unica**, porque `Afiliada` e o primeiro modulo cujo dominio ja
existe no painel do admin (`lib/afiliadas`). Ela nao se contenta em afirmar "os
dois leem a mesma lista": prova IDENTIDADE DE REFERENCIA
(`perfil === DEMO_AFFILIATES[0]`), e depois faz a CROSS-CHECK que torna a
identidade util — o cupom (`CARINNAS`) e a comissao (`5%`) que a tela da cliente
imprime sao os valores do ADMIN, produzidos pelo `formatCommission` do ADMIN. Se
alguem declarasse uma afiliada propria na area da cliente, os dois numeros
divergiriam no primeiro ajuste do admin, e a bancada acusaria.

### A medida que PARECIA contradizer o `gap-6` — e nao contradizia

A bancada deste modulo reprovou uma prova na primeira rodada, e a reprovacao
estava certa em RECUSAR e errada na CONCLUSAO que sugeria. Vale registrar, porque
e o tipo de armadilha que reaparece.

A distancia entre a borda de baixo do input do NOME (y=524) e a borda de cima do
input do TELEFONE (y=579) mede **55 px**. O gap HORIZONTAL entre os dois inputs da
segunda linha mede 24 px, de borda a borda, sem glifo nenhum no meio — esse e o
`gap-6`, e ele e limpo. Um unico `gap` governa os dois eixos. Entao 55 contra 24
parecia dizer: "a grade vertical usa um gap diferente, e a transcricao errou".

Nao errou. O que entra entre os dois inputs NAO e so o gap — e o gap mais a CAIXA
DE LINHA do rotulo. O rotulo e um `<span>` dentro de um `<label>` numa linha
propria, e a caixa de linha dele nao tem a altura da TINTA (13 px em `text-sm`)
nem a altura do `1em` (16): tem a altura da LINHA. O `preflight` do Tailwind poe
`line-height: 1.5` no `html`, herdado por todo mundo; o `<span>` nao declara
`line-height` nenhum, e nessa familia isso resolve para **1.5 x 16 = 24 px**.
Somando:

    24 (gap-6) + 24 (caixa do rotulo) + 6 (mt-1.5) + 0 + 1 (borda) = 55

que e exatamente o medido. **Nao existe segundo gap.** O `gap-6` e um so, e o
print provou a existencia da caixa de linha — uma coisa que nenhum print desenha,
porque caixa de linha nao tem tinta.

A licao e a de sempre nesta area, numa forma nova: a tinta MEDE o glifo, e o que
separa dois blocos nem sempre e o que se ve. Quando duas medidas do mesmo
`grid-gap` discordam, a hipotese de "o gap mudou" tem que vir DEPOIS da hipotese
de "entrou no meio algo sem tinta".

### A prova mais forte deste modulo: geometria que distingue DUAS declaracoes

Toda medida deste arquivo foi escrita para nao passar por acidente. Nao basta a
medida "estar perto" da classe: ela tem que separar a classe escolhida da classe
vizinha plausivel. As dez:

| medida | leitura | classe | vizinha que ela EXCLUI |
| ------ | ------- | ------ | ---------------------- |
| coluna lateral | 320 px | `lg:grid-cols-[1fr_320px]` | `300px` (daria 300) |
| gap entre colunas | 32 px | `gap-8` | `gap-6` (daria 24) |
| gap entre inputs | 24 px | `gap-6` | `gap-8` (daria 32) |
| recuo do cartao | 41 px nos DOIS lados | `md:p-10` | `md:p-8` (daria 33) |
| altura do input | 48 px | `h-12` | `h-11` (44) e `h-14` (56) |
| altura do botao | 48 px | `h-12` | idem |
| largura do botao | 222 px | `md:w-auto` + `px-10` | `w-full` (daria 1756) |
| separador→botao | 25 px | `pt-6` | `pt-4` (16) e `pt-8` (32) |
| largura do separador | 1823 px | filho do cartao | dentro da grade (pararia em 1229) |
| gap vertical | 55 px | `gap-6` + caixa de linha | `gap-8` (daria 63) |

A nona e a mais interessante das dez: a largura do separador nao prova uma
CLASSE, prova a POSICAO do elemento na arvore. Uma linha divisoria que fosse
filha da grade interna pararia em x=1229, porque respeitaria a coluna. Ela
atravessa 1823 px, de x=340 a x=2162 — logo e filha do CARTAO, e nao da grade.
Estrutura provada por medida, sem abrir o navegador.

### As tres falhas de INSTRUMENTO desta bancada — e uma delas era o proprio instrumento se enganando

A bancada deste modulo rodou **85 provas** e reprovou **tres** na primeira
rodada. Duas eram defeito do instrumento, uma era uma medida que eu tinha lido
errado. As tres ficam registradas, porque o valor das bancadas desta area esta
menos em passar do que em FALHAR na hora certa.

**1. A prova do `placeholder` procurava no lugar errado.** O helper `textos()`
remove as tags — e com isso o `placeholder` sai junto, porque ele e um ATRIBUTO.
O rotulo `Telefone / WhatsApp` ficava no texto e o `(00) 00000-0000` nao, e a
prova reprovava uma tela que estava certa. O conserto foi procurar o rotulo no
texto e o placeholder no HTML cru. **A licao:** um helper que "limpa o HTML" nao
serve para provar presenca de atributo; `placeholder` e atributo, e nao texto —
a mesma armadilha que `feedback_bancada_placeholder_atributo.md` ja tinha
registrado num modulo anterior. Ela reapareceu porque eu escrevi a prova antes de
lembrar do registro.

**2. A contagem de LINHAS do corpo do cartao e inverificavel aqui.** A prova
tentava derivar a quebra de linha do texto (3 frases -> 4 linhas). Nao ha motor
de layout numa bancada de HTML estatico e `renderToStaticMarkup` nao resolve
unidades `rem`: o texto sai numa linha so, e a diferenca entre "caberia em 4" e
"caberia em 5" e de alguns pixels de largura. Afirmar isso seria precisamente o
que este projeto proibiu (`feedback_medir_janela_truncada.md`). A prova foi
TROCADA por duas que sao verificaveis: o corpo esta inteiro, e a classe que
governa a quebra (`text-xs leading-relaxed`) e a do original. **A licao:** quando
uma prova depende de layout, ela precisa de um navegador — ou deixa de ser prova e
vira estimativa.

**3. A prova do gap vertical — esta era medida ruim mesmo.** Ver a secao acima:
o numero estava certo e a LEITURA estava errada. O conserto foi escrever a soma
inteira (gap + caixa de linha + margem + borda) na propria prova, de modo que a
conta feche em 55 e a proxima pessoa nao refaca a deducao.

## A bancada do modulo 12 — dez camadas, e a mais densa da area

`bench-cliente-seguranca.mjs` prova **99/99** em dez secoes. As duas primeiras
existem porque esta e a primeira tela da area com **logica pura exportada** —
`validarSenha` e `ultimoAcesso` sao funcoes sem estado, e uma funcao sem estado
pode ser chamada com um caso de cada vez. As anteriores so tinham pedacos
montaveis; esta tem pedacos *chamaveis*, e isso muda o que uma bancada consegue
provar.

### A prova que so uma funcao pura permite: a ORDEM das validacoes

O original faz, nesta ordem, dentro do handler:

    if (pw.length < 6) return toast.error("Mínimo 6 caracteres");
    if (pw !== pw2) return toast.error("Senhas não conferem");

Com as duas senhas curtas **e** diferentes, os dois ramos estao armados ao mesmo
tempo — e o aviso que sai prova QUAL deles rodou primeiro. Um par trocado
(`'12345'` / `'99999'`) tem que devolver o erro da CURTA. Se alguem trocar a
ordem, este caso cai, e **nenhum outro cai**: os demais casos tem so um ramo
armado cada. E, como o `strict` do projeto nao pega uma inversao de condicao
(ver `feedback_condicao_booleana_invisivel`), e a bancada ou nada.

### A fronteira do `< 6`

`length < 6` e `length <= 6` concordam em tudo, menos em um caso: exatamente 6
caracteres. Por isso existe um caso so para ele. Sem essa prova, um `<` viraria
`<=` e a validacao passaria a recusar senhas de seis — sem erro, sem aviso, e sem
nenhuma outra prova notando.

### As duas armadilhas de instrumento que reapareceram, e a terceira que era nova

**1. O comentario virou falso positivo — e eram CINCO.** As provas ao contrario da
secao 10 liam o arquivo CRU (`cruView`) procurando `bg-beige/`. A tela tem tres
`bg-beige` — todos em PROSA, explicando por que o token do original nao foi
usado. A prova reprovava a propria explicacao. Conserto: ler `fonteView`, que e o
arquivo **sem comentarios** (`feedback_bancada_comentario_vira_falso_positivo`).
O mesmo defeito estava na secao 6, em outra forma.

**2. `textos()` e o atributo, de novo.** Ja registrado em
`feedback_bancada_placeholder_atributo`, e ja custou uma rodada no modulo 11. Aqui
a bancada ja nasceu sabendo: os dois `placeholder` sao procurados no HTML CRU, e
o rotulo no texto limpo. A armadilha virou uma PROVA — a secao 6 assere que o
`placeholder` **nao** esta no texto limpo, para que a proxima pessoa nao "conserte"
o instrumento achando que e bug.

**3. A agulha curta casando o que nao devia (nova).** A prova do menu fazia
`fonteNav.includes('/conta/seguranca')` — e reprovava. Mas o `href` de
`nav.ts` e **construido** por `clientHref(slug)`; a string `/conta/seguranca` nao
existe no arquivo. A tela estava certa e o instrumento errado: procurar o valor
em vez de chama-lo. Conserto: `require` do `nav.js` emitido, e a prova pergunta
a FUNCAO (`nav.clientHref(i.slug) === '/conta/seguranca'`). E a mesma classe de
`agulha-curta-casa-import`, invertida: la a agulha achava demais, aqui achava de
menos.

### A prova central: existe UM unico portao de sessao

`account-shell.tsx` e o PORTAO da area — e o unico lugar onde vive `dentro`. O
`Logout` do rodape tracejado (`cli-020`) e o TERCEIRO botao a fechar a mesma
conta, depois do botao da coluna e do de largura total no celular. Se a tela
tivesse o proprio `useState`, haveria dois portoes, e o `Logout` fecharia metade
da arvore.

A bancada prova isso **varrendo a area inteira**:

    const comDentro = raizes.filter((f) => /const \[dentro,/.test(readFileSync(f, 'utf8')));

Se aparecer um segundo arquivo com `const [dentro,`, a prova cai e diz QUAL
arquivo. E uma prova que fica mais forte a cada modulo futuro: ela nao verifica a
tela de hoje, verifica que ninguem criou a segunda verdade.

### O instrumento escolhido para levar o `sair` ate a view: contexto

`children` sao elementos criados pela PAGINA (Server Component), e a pagina nao
tem `sair`. Tres caminhos foram considerados:

| caminho | veredito |
| ------- | -------- |
| `cloneElement` no filho | funciona, mas exige uma lista de tipos (envelhece) ou injeta `onSair` em todo `<div>` (o React denuncia a prop desconhecida) |
| segundo `useState` na view | **descartado** — seria o login paralelo que a regra proibe |
| `createContext` na casca | **escolhido** |

O contexto ganha por um motivo preciso: ele vale por **POSICAO NA ARVORE**, e nao
por quem criou o elemento. Mesmo que a pagina tenha chamado
`createElement(SegurancaView)` antes, no momento em que a casca RENDERIZA esse
elemento dentro do `<PortaoDaConta.Provider>`, a view passa a ser descendente e
enxerga `sair`. O valor padrao e um `async () => {}` — um no-op, e nao um `throw`
— para que a bancada possa montar a tela sem casca.

## Auditoria final da FASE 2 — o que a bancada de conjunto provou

A `bench-cliente-auditoria.mjs` e a ultima da fase, e ela prova **38** coisas que
nenhuma bancada de modulo tem como ver sozinha. Ela nao repete nenhuma prova de
tela: as medidas continuam nas bancadas de modulo, cada uma contra o print dela.
Aqui esta o que so existe com **as treze telas no disco juntas**.

**1. O fechamento das rotas (5 provas).** As dez rotas do disco sao EXATAMENTE as
dez declaradas — nem uma a mais, nem uma a menos. Os **9 itens** da coluna e os
**8 atalhos** resolvem, cada um, numa rota existente; e o caminho de VOLTA: nenhuma
rota fica orfa. Esta e a prova que o typecheck nao faz: um `clientHref` que montasse
`/conta/seguro` em vez de `/conta/seguranca` passaria pelos tipos e daria 404. A
bancada tambem prova a **divergencia 2** em vez de afirma-la: `/conta/afiliada` e
alcancavel **pelos atalhos** e **nao esta na coluna** — se alguem a promovesse a
item, a prova acusaria.

**2. A origem unica (6 provas).** Nenhuma tela de admin e importada — a area da
cliente REDESENHA, e nao reaproveita layout do admin (`components/admin` e
INTERFACE; `lib/<dominio>` e DADO, e sao coisas diferentes). As dependencias de
fora da area sao exatamente **nove** modulos, e os quatro de **dominio** entram por
mao unica: `lib/pedidos` (demo+types) e `lib/afiliadas` (demo+types). A prova da
mao unica e a varredura do outro lado: **nenhum** arquivo de admin importa de
`lib/cliente`.

**3. A fronteira do banco (3 provas).** Nenhuma raiz importa cliente de banco,
nenhuma le `process.env`, e nenhum dos **seis padroes de segredo** (chave de
gateway, JWT, string de conexao, nome de variavel de conexao, chave de e-mail)
aparece em codigo. E esta a prova que sustenta a REGRA DE HONESTIDADE: se a area
inteira le de `data.ts`, nenhuma tela pode afirmar dado real. As agulhas foram
escritas para casar a DEPENDENCIA e nao a palavra em prosa — `data.ts` EXPLICA tres
vezes que o original usava `supabase`, e uma varredura crua teria acusado a propria
explicacao.

**4. O contrato das leitura e das escritas (7 provas).** As **11 leituras** e as
**8 escritas** foram CHAMADAS, uma por uma, e nao lidas no codigo. As onze devolvem
`source: 'demo'` com o motivo pendente — nenhuma afirma `database`. As oito
devolvem `{ ok: boolean }`. E a escrita que mais poderia mentir — `salvarSenha` —
devolve `ok: false` **com motivo**, em vez de fingir que trocou.

**5. As provas ao contrario (7 provas).** Ausentes do codigo: `bg-beige`, o
`toLocaleDateString`, o `window.location.origin` e o `overflow-x-hidden`. Nenhuma
escape de tipo (`any`/`@ts-ignore`) — o `strict: true` do projeto vale na area
inteira. E a prova da paleta, que precisou ser reescrita: **nenhuma cor crua FORA
do `text-amber-600` medido**. Ver "A excecao que a auditoria quase apagou".

**6. A cadeia (2 provas).** Os **24** componentes da area, e nenhum orfao.

**7. O STATUS contra o disco (5 provas).** Os treze modulos PRONTO, nenhum "a
fazer", e as **13** bancadas citadas no STATUS sao exatamente as do disco — a
prova contra a memoria stale. A medicao `12 + 260 + 40 + 2212 + 12 = 2536` segue
registrada: e a base das bancadas de modulo, e apagar essa linha apagaria a prova
de coluna.

### A excecao que a auditoria quase apagou

A primeira rodada da auditoria deu **27/32** — cinco falhas. Quatro eram do
INSTRUMENTO, e uma vale ser contada porque quase virou uma mentira na direcao
contraria.

A prova da paleta nasceu como "nenhuma cor crua do Tailwind na area", e acusou
`text-amber-600` em dois arquivos. A conclusao obvia seria converter para o token
`--warning`. Mas o `amber-600` do KPI **nao e descuido**: a bancada do Dashboard
MEDIU o amarelo do cartao no print `004603` e achou a mediana **(228,124,20)**, que
E o `amber-600`. A escolha esta registrada como **divergencia 16**: o original
declara `amber-500`, e usar `500` ali e `600` no KPI poria DOIS ambers no mesmo
painel para o mesmo papel.

Ou seja: uma cor que o MATERIAL prova nao pode ser varrida por uma regra geral. Se
eu tivesse obedecido ao instrumento, teria trocado uma cor medida por uma
inferencia — e apagado uma decisao com lastro de pixel. A prova foi reescrita como
**allowlist de uma excecao**: nenhuma cor crua FORA do `text-amber-600` medido, e
o `amber-600` **tem que continuar la** (senao a divergencia 16 ficaria stale).

E a prova de orfao. A primeira versao so olhava
`from '@/components/cliente/<x>'` e acusou **dezesseis** componentes como orfaos —
todos falsos positivos: os imports reais usam **alias**
(`import { AccountShell as AccountShellBase } from './account-shell'`). O
instrumento procurava a forma que o autor imaginou, e nao a que o projeto escreveu.
A busca passou a ser pelo NOME DO ARQUIVO em qualquer `from`.

As outras tres falhas eram do instrumento tambem, e do mesmo tipo: nomes que eu
escrevi de memoria (`getPedidos`, `salvarEnderecos`) em vez de ler do disco
(`listPedidos`, `salvarEndereco`); e o STATUS, que ainda nao citava a propria
bancada de auditoria. Zero divergencia de PROJETO — as cinco eram da bancada.

## Checkpoint — modulo 13 (Afiliada)

- **MODULO** Afiliada · **STATUS** PRONTO · **ROTA** `/conta/afiliada`
- **PRINTS** **NENHUM.** Esta e a unica tela da area sem print proprio — os vinte
  arquivos cobrem dez telas, e `Afiliada` nao e uma delas. A referencia prova
  desta tela apenas o ITEM: o atalho `Afiliada` na grade de oito cartoes do
  `cli-001`. Ver "A tela sem print" abaixo, e a divergencia 34.
- **ARQUIVOS** `src/components/cliente/afiliada-view.tsx` (novo),
  `src/app/(cliente)/conta/afiliada/page.tsx` (novo), `src/lib/cliente/types.ts`
  (`VendaAfiliada`, `ResumoAfiliada`, `ContaAfiliada`), `src/lib/cliente/metrics.ts`
  (`vendaPaga`, `rotuloVenda`, `resumirVendas`, `resumoAfiliada`, `linkDivulgacao`,
  `idCurtoPedido`, `dataVenda`), `src/lib/cliente/data.ts` (`getAfiliada`),
  `bancadas/bench-cliente-afiliada.mjs` (nova). **Nenhum arquivo compartilhado com
  o Admin foi alterado neste modulo.**
- **ESTADOS** carregando (`Carregando...`); **convite** (conta sem perfil — o
  estado da demonstracao); **painel** (com perfil — provado com a afiliada do
  Admin injetada por prop); historico VAZIO; historico com vendas e os dois selos
  (`Pago`/`Pendente`); e a condicao `> 6` do `Ver todas as vendas`, nos dois lados.
- **BANCADA** `bench-cliente-afiliada.mjs` **100/100**. Primeira rodada: 97/98 —
  quatro falhas de INSTRUMENTO, todas do mesmo tipo ja conhecido: a agulha casando
  PROSA em vez de CODIGO (o bloco de explicacao do topo cita `DEMO_AFFILIATES` e
  `clipboard`), mais o `Dataset` que a bancada esqueceu de desembrulhar. Zero
  divergencia.
- **TYPECHECK** `node node_modules/typescript/bin/tsc --noEmit` -> **EXIT=0**.
- **REGRESSÃO** as ONZE bancadas da area, verdes: nav 83/83, login 71/71, conta
  62/62, pedidos 76/76, favoritos 43/43, enderecos 95/95, medidas 88/88, clube
  99/99, cupons 76/76, dados 85/85, seguranca 99/99. **Admin intacto** — `find`
  sobre o admin com `-newermt 2026-10-03` devolve vazio (o arquivo mais novo do
  admin e de 2026-10-02 15:33), e `bench-cupons.mjs` continua **65 provas, 0
  falha(s)**.
- **DIVERGENCIAS** 34 a 37 (abaixo).
- **PENDENCIAS NEON** ver a secao de pendencias: quatro novas.
- **PROXIMO** modulo 14 — as bancadas do cliente consolidadas e a **auditoria
  final da Fase 2** (task #15). Depois a Fase 3 sem esperar autorizacao.

## As quatro divergencias deste modulo

**34. Esta tela NAO TEM PRINT — e por isso ela nao tem medida de pixel.** A regra
de prioridade da referencia (`PRINT > ORIGINAL > ESTRUTURA > INFERENCIA`) tem o
primeiro termo AUSENTE aqui. Nos outros doze modulos uma medida de captura
desempatou rotulos, corrigiu espacos e reprovou invencoes minhas. Aqui nao ha o
que medir: todas as medidas vem das CLASSES de `conta.afiliada.tsx`. Escrever uma
"prova de pixel" aqui seria inventar uma medicao que ninguem fez — o defeito de
`medir-janela-truncada`, em que o instrumento confirma o que o autor ja queria
crer. Esta bancada declara o que NAO prova, e prova o que pode: as funcoes puras
e a fonte unica.

**35. O original monta o link com `window`; aqui a origem entra por PROP.** O
`conta.afiliada.tsx` escreve `` `${window.location.origin}/?ref=${slug}` ``.
`window` nao existe em Node: chamalo derrubaria a bancada com `ReferenceError` no
instante do render. Mais grave que o instrumento, porem, e o dominio: a
demonstracao nao tem site publico que possa afirmar, e imprimir
`https://closetlunar.com.br` seria inventar um endereco. A origem entra por prop e
a demonstracao passa `''` — o que produz o caminho relativo `/?ref=<slug>`. A
bancada prova os QUATRO ramos (com/sem slug x com/sem origem) e prova, ao
contrario, que sem slug NAO sai um `?ref=` sem valor, que seria um link de
indicacao que nao identifica ninguem. Quando a Fase 3 existir, a origem entra ali
e o link vira absoluto.

**36. A paleta CRUA do original (`emerald`/`amber`) virou os tokens do projeto.**
O original pinta o `Saldo Total` de `text-emerald-600`, o `A Receber` de
`text-amber-600`, e monta os selos com `bg-emerald-50`/`bg-amber-100`. O projeto
nao usa a paleta crua do Tailwind: usa `--success` e `--warning`, que a area
inteira (e o admin) ja usa para os mesmos dois papeis. E a MESMA conversao da
divergencia 30 do modulo 12: a FORMA do original, a cor do projeto. A bancada
prova a ausencia de `emerald-600`/`amber-600` no CODIGO.

**37. O `Copiar` e o `Quero me cadastrar agora` existem e NAO agem.** O original
copia de verdade (`navigator.clipboard`) e troca o rotulo por um `Check` por 2
segundos; e o botao do convite chama um fluxo de cadastro. Nesta fase nada disso
tem para onde ir: o link nao aponta para um site que exista, e nao ha escrita de
afiliacao. A escolha nao foi remover os botoes — eles estao no original e na
referencia — mas nao FINGIR: o `Copiar` avisa que a copia entra na fase de
integracao, e o botao do convite nao tem `onClick`, como o `VER NO AVATAR 3D` de
Medidas e os botoes de rastreio de Meus Pedidos. Um aviso que diz "copiado!" sem
ter copiado nada seria a promessa que a REGRA DE HONESTIDADE proibe.

## Checkpoint — modulo 12 (Segurança)

- **MODULO** Segurança · **STATUS** PRONTO · **ROTA** `/conta/seguranca`
- **PRINTS** `004914` (`cli-019`) e `004922` (`cli-020`) — as duas capturas do
  mesmo painel. A `cli-019` traz o cabecalho, o cartao `Alterar Senha` inteiro e
  o topo do `Sessões & Acesso`; a `cli-020` traz o resto.
- **ARQUIVOS** `src/components/cliente/seguranca-view.tsx` (novo),
  `src/app/(cliente)/conta/seguranca/page.tsx` (novo),
  `src/components/cliente/account-shell.tsx` (**alterado** — o portao),
  `src/lib/cliente/types.ts` e `metrics.ts` e `data.ts` (ja alterados na
  abertura do modulo: `AcessoConta`, `ultimoAcesso`, `getAcesso`/`salvarSenha`/
  `encerrarSessoes`), `bancadas/bench-cliente-seguranca.mjs` (nova).
- **ESTADOS** carregando (`Carregando...`); carregado com `ultimoAcessoEm: null`
  (`Último Login` = `—`); senha curta (`Mínimo 6 caracteres`); senhas diferentes
  (`Senhas não conferem`); confirmacao aberta (`Encerrar todas as sessões? Você
  precisará entrar novamente.` + `Cancelar`/`OK`); aviso de sucesso; aviso de
  erro; e `Logout` fechando o portao da casca.
- **BANCADA** `bench-cliente-seguranca.mjs` **99/99**. Primeira rodada: 91/95 —
  tres falhas de instrumento (o comentario, de novo) e uma de assercao propria
  (a comparacao da frase acentuada que eu mesmo escrevi). Zero divergencia.
- **TYPECHECK** `node node_modules/typescript/bin/tsc --noEmit` -> **EXIT=0**.
- **REGRESSÃO** as dez bancadas da area, verdes: nav 83/83, conta 62/62, login
  71/71, pedidos 76/76, favoritos 43/43, enderecos 95/95, medidas 88/88, clube
  99/99, cupons 76/76, dados 85/85. **Admin intacto** — `find` sobre
  `src/app/admin`, `src/components/admin` e `src/lib/admin` com `-newermt`
  devolve vazio, e `bench-cupons.mjs` continua **65 provas, 0 falha(s)**.
- **DIVERGENCIAS** 29 a 33 (abaixo).
- **PENDENCIAS NEON** ver a secao de pendencias: cinco novas.
- **PROXIMO** modulo 13 — Afiliada (`/conta/afiliada`; **NAO e item de sidebar** —
  e um dos oito atalhos do dashboard, `cli-001`). Depois, a auditoria final da
  Fase 2.

## As cinco divergencias deste modulo

**29. O `confirm()` do original virou uma faixa desenhada.** O original usa
`confirm("Encerrar todas as sessões? Você precisará entrar novamente.")` — uma
caixa do sistema. Reproduzi-lo seria uma armadilha concreta: `confirm` NAO EXISTE
em Node, e a bancada derrubaria o processo com `ReferenceError` no instante em que
chamasse o encerramento. Nao ha instrumento nesta fase que verifique uma caixa
bloqueante do sistema. A pergunta virou ESTADO (`confirmando`), com o texto exato
do original (provado contra o original, por regex) e os dois rotulos que a caixa
nativa oferecia (`Cancelar`/`OK`). O comportamento e o mesmo; o veiculo muda.

**30. O hover destrutivo usa `danger`, e nao o `rose-600` do Tailwind.** O
original escreve `hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200`. O
`--danger` do projeto mede (222,60,54); o `rose-600` do Tailwind mede (225,29,72).
Nao sao a mesma cor. O projeto ja decidiu — em todas as areas — nao ter dois
vermelhos com o mesmo papel (o `carrinho-abandonado`, as `afiliadas`, a
`busca` do admin todos usam `danger-surface`/`danger-foreground`). A FORMA do
hover (fundo claro com texto e borda vermelhos) e a do original; o vermelho e o
do projeto.

**31. As duas capturas parecem deslocadas uma em relacao a outra.** O painel de
conteudo aparece em y=88 na `cli-019` e em y=86 na `cli-020` — 14 px de diferenca
de origem. A explicacao mais simples e que as duas nao foram recortadas com a
mesma margem, e nao que a pagina mude de posicao entre uma e outra. Como as
medidas internas de cada captura fecham entre si (a largura do botao, 967 =
1049 - 2 x 41, e a mais forte), o deslocamento nao contamina nenhuma prova.

**32. O `Sair` da casca virou `async`.** Nao havia como a view consumir um `sair`
sincrono por contexto e o tipo ficar honesto para o futuro: encerrar sessao, quando
houver servidor, vai ser assincrono. A implementacao de hoje continua so trocando
um booleano; o que mudou foi a ASSINATURA. E o mesmo movimento do modulo 11, onde
a escrita `salvarDadosConta` nasceu `async` para caber o `await` que ainda nao
existe.

**33. `AcessoConta` nao tem campo de senha — e a ausencia e a decisao.** O
original le `pw`/`pw2` do estado do formulario e os manda direto para
`supabase.auth.updateUser`. Nao existe tipo de dominio por onde uma senha passe
neste projeto, e `salvarSenha()` nao recebe parametro nenhum — a bancada prova a
ARIDADE da funcao. Uma senha que nao entra em tipo nenhum nao tem como ser
logada, persistida ou mostrada por engano. Quando o provedor entrar, a senha vai
direto do formulario para a chamada de auth, sem tocar o dominio.

## Checkpoint — modulo 11 (Dados da Conta)

- **MODULO** Dados da Conta · **STATUS** PRONTO · **ROTA** `/conta/dados`
- **PRINTS** `cli-017` (`004857`, o topo: `Dados da Conta` + a descricao, o
  formulario com `NOME COMPLETO` em linha cheia, `TELEFONE / WHATSAPP` com o
  `placeholder` e `E-MAIL DE ACESSO` preenchido, o botao `SALVAR ALTERAÇÕES`, e
  os DOIS cartoes laterais `Segurança do E-mail` e `Privacidade`); `cli-018`
  (`004905`, a continuacao: o `E-MAIL DE ACESSO` e o `Privacidade` inteiros, e o
  rodape `@closetlunar`)
- **ARQUIVOS** `src/app/(cliente)/conta/dados/page.tsx` (novo),
  `src/components/cliente/account-view.tsx` (novo — `AccountView`, `CampoDados`,
  `CartaoAviso`), `bancadas/bench-cliente-dados.mjs` (novo). EDITADOS:
  `src/lib/cliente/types.ts` (`ContaCliente` ganhou `nomeCompleto` e `telefone`,
  ambos anulaveis), `src/lib/cliente/data.ts` (`getConta` passa a devolver os dois
  em `null`; `salvarDadosConta` novo), `src/app/globals.css` (o token
  `--placeholder`, com nota), `tailwind.config.ts` (a chave `placeholder`) — as
  duas ultimas sao COMPARTILHADAS com o admin e estao justificadas na secao
  "Alteracoes em arquivos compartilhados com o Admin"
- **ESTADOS** o do material (conta sem nome e sem telefone: o `NOME COMPLETO`
  vazio, o `TELEFONE / WHATSAPP` mostrando o `placeholder`, o e-mail preenchido)
  e os que a bancada exercita: o `CampoDados` nos tres campos com os valores do
  print, o `CartaoAviso` com e sem fundo, e o aviso de salvamento nos DOIS ramos
  (a escrita devolve `{ ok: false }`, e a tela mostra o `reason`). O ramo de
  SUCESSO — `Confirme o novo e-mail…` contra `Dados atualizados`, escolhido pela
  comparacao com o e-mail da conta — esta escrito na tela e provado por bancada,
  ainda que nao seja alcancavel sem provedor
- **BANCADA** `bench-cliente-dados.mjs` **85/85** apos a correcao. A primeira
  rodada deu `77/80`, com TRES falhas: duas do INSTRUMENTO (o `textos()` que
  remove o `placeholder` junto com as tags; a quebra de linha que nao e
  verificavel sem motor de layout) e uma de LEITURA de medida (o gap vertical,
  que fecha exatamente com o MESMO `gap-6` somado a caixa de linha do rotulo).
  Ver as duas secoes acima
- **TYPECHECK** `node node_modules/typescript/bin/tsc --noEmit` → **EXIT=0**
- **REGRESSAO** nav `83/83`, conta `62/62`, login `71/71`, pedidos `76/76`,
  favoritos `43/43`, enderecos `95/95`, medidas `88/88`, clube `99/99`, cupons
  `76/76`. **Zero regressao.** Admin intacto (nenhum arquivo modificado, e
  `bench-cupons.mjs` continua `65 provas, 0 falha(s)`)
- **DIVERGENCIAS** 25 (a tinta do `placeholder`, que o original nao declara),
  26 (a secao de arquivos compartilhados mudou de NENHUMA para DUAS),
  27 (`Dados da Conta` no `h2` contra `Meus Dados` no atalho),
  28 (os dois icones sao os de `nav.ts`, nao reabertos)
- **PENDENCIAS NEON** `salvarDadosConta` NAO vira um `update` de tabela quando o
  Neon entrar — `name` e `phone` nao sao colunas de `customers`, sao metadados da
  CONTA (`user_metadata`), e o e-mail vive em `auth.users` e troca com
  confirmacao por link. A assinatura fica igual; o CORPO e que troca de dono (o
  provedor de auth, e nao o Prisma). Ver a nota longa em `data.ts`
- **PROXIMO** modulo 12 — Seguranca (`/conta/seguranca`, print `cli-019` =
  `004914`)

## Checkpoint — modulo 10 (Cupons)

- **MODULO** Cupons · **STATUS** PRONTO · **ROTA** `/conta/cupons`
- **PRINTS** `cli-015` (`004841`, o topo: `Meus Cupons` + o cartao vencido com
  `EXPIRADO`), `cli-016` (`004850`, a continuacao: o mesmo cartao e o rodape
  `@closetlunar`)
- **ARQUIVOS** `src/app/(cliente)/conta/cupons/page.tsx` (novo),
  `src/components/cliente/coupons-view.tsx` (novo — `CouponsView`, `CartaoCupom`,
  `VazioCupons`, `cartaoFechado`), `src/lib/cliente/demo.ts` (o `minimo: 150` ->
  `0`, com a nota das duas provas), `bancadas/bench-cliente-cupons.mjs` (novo),
  `bancadas/bench-cliente-nav.mjs` (a prova do cupom: `150` -> `0`)
- **ESTADOS** carregando (`Carregando...` — a espera cobre a VALIDADE tambem),
  cartao FECHADO (o do print: escurecido, sem botao), cartao ABERTO (por render,
  sem print), vazio (por render), copia (aviso `Cupom CLOSET10 copiado`)
- **BANCADA** `bench-cliente-cupons.mjs` **76/76**
- **TYPECHECK** `node node_modules/typescript/bin/tsc --noEmit` → `EXIT=0`
- **REGRESSAO** nav `83/83`, conta `62/62`, login `71/71`, pedidos `76/76`,
  favoritos `43/43`, enderecos `95/95`, medidas `88/88`, clube `99/99`
- **DIVERGENCIAS** 22 (o `minimo` inventado corrigido), 23 (a copia que aqui
  funciona), 24 (os dois rotulos da mesma rota)
- **PENDENCIAS NEON** ver a secao abaixo — a lista de cupons passa a ser
  `coupons where is_active`, e a validade continua sendo comparada com o relogio
  do CLIENTE (a data do cupom e `timestamptz`, e o "hoje" e o da cliente)
- **PROXIMO** modulo 11 — Dados da Conta (`/conta/dados`, prints `cli-017` =
  `004857`, `cli-018` = `004905`)



- **MODULO** Clube VIP & Cashback · **STATUS** PRONTO · **ROTA** `/conta/pontos`
- **PRINTS** `cli-012` (`004801`, o topo: cartao escuro `BRONZE`, `Seu Saldo 0`,
  barra vazia `0 / 1000 PTS`, `FALTAM 1000 PONTOS PARA VOCÊ SE TORNAR PRATA`);
  `cli-013` (`004819`, o resto: as 3 recompensas bloqueadas, os 4 niveis, as
  `Regras do Programa`); `cli-014` (`004830`, o rodape `@closetlunar`).
- **ARQUIVOS** `src/components/cliente/clube-view.tsx` (novo),
  `src/app/(cliente)/conta/pontos/page.tsx` (novo),
  `bancadas/bench-cliente-clube.mjs` (novo). EDITADOS:
  `src/lib/cliente/{types,demo,metrics,data}.ts` — `ResumoClube` e os quatro
  tipos do clube; os quatro niveis + extrato + recompensas + regras; as quatro
  funcoes de pontos; `getClube()` e `resgatarRecompensa()`.
- **ESTADOS** os tres do material (`BRONZE` / saldo 0 / barra vazia; as tres
  recompensas BLOQUEADAS; o extrato com `Nenhuma movimentação.`), mais os dois
  que nenhum print mostra e o codigo preve: `Resgatar Agora` (saldo cobrindo o
  custo) e `Nível Máximo Atingido!` (topo da escada), ambos exercitados na
  bancada.
- **BANCADA** `bench-cliente-clube.mjs` **99/99** apos a correcao. A primeira
  rodada deu `83/89`, com SEIS falhas: tres eram da TELA (a regra e a magnitude
  do sinal) e tres do INSTRUMENTO (a grafia de `Seu Saldo` e as duas caudas de
  frase quebradas por linha no arquivo). Ver as duas secoes acima.
- **TYPECHECK** `node node_modules/typescript/bin/tsc --noEmit` → **EXIT=0**.
- **REGRESSÃO** nav 83/83 · conta 62/62 · login 71/71 · pedidos 76/76 ·
  favoritos 43/43 · enderecos 95/95 · medidas 88/88. **Zero regressao.**
- **DIVERGÊNCIAS** 18 (o sinal do ajuste: o saldo do original esta errado),
  19 (o `onClick` que o original omite), 20 (`h2` no lugar do `h1`), 21 (as cores
  dos niveis sao demonstracao, com o Bronze medido na faixa e nao na tinta).
- **PENDÊNCIAS NEON** `loyalty_tiers` (nome, cor, `min_points`, `benefits` jsonb),
  `loyalty_points` (tipo, pontos, descricao, `created_at`, por cliente),
  `loyalty_config` (as chaves `rewards` e `general_rules`). O RESGATE sao duas
  escritas — o debito e o cupom — e as duas tem que caber na MESMA transacao; a
  assinatura e uma, o efeito e duplo. As cores dos niveis vem da COLUNA `color`
  em producao; hoje sao medidas.
- **PRÓXIMO** modulo 10 — Cupons (`/conta/cupons`, print `cli-015` = `004841`).

## Checkpoint — modulo 8 (Minhas Medidas)
- **MODULO** Minhas Medidas · **STATUS** PRONTO · **ROTA** `/conta/medidas`
- **PRINTS** `004742` (`cli-010`, o formulario PREENCHIDO: 165/59/28, os dois
  selects, o cartao escuro `Aguardando dados`) e `004753` (`cli-011`, rolado: os
  dois pares Sim/Não, o botao `SALVAR PERFIL DE MEDIDAS`, o `Histórico de Medidas`
  VAZIO)
- **ARQUIVOS** `src/app/(cliente)/conta/medidas/page.tsx` (novo),
  `src/components/cliente/measures-view.tsx` (novo — `MeasuresView`, `FIELDS`,
  `TAMANHOS`, `BotaoSimNao`, `CelulaValor`), `src/lib/cliente/types.ts`
  (`PerfilMedidas`, `MedidaHistorico`), `src/lib/cliente/demo.ts`
  (`DEMO_PERFIL_MEDIDAS`, `DEMO_HISTORICO_MEDIDAS`), `src/lib/cliente/data.ts`
  (`getPerfilMedidas`, `listHistoricoMedidas`, `salvarPerfilMedidas`),
  `src/lib/cliente/metrics.ts` (`dataCurta`), `bancadas/bench-cliente-medidas.mjs`
  (novo, **88/88**)
- **ESTADOS** carregando (`Carregando...`), formulario preenchido (o ramo do
  print), botao Sim/Não aceso e apagado, campo `Há quanto tempo?` condicional ao
  `Sim`, cartao escuro com `Aguardando dados` (o `usual_size` e `null`),
  historico VAZIO (o bloco tracejado), aviso (`Altura, peso e idade são
  obrigatórios.` na validacao; o `reason` no save, porque hoje nao grava)
- **BANCADA** `bench-cliente-medidas.mjs` **88/88** · **TYPECHECK** `tsc --noEmit`
  **EXIT=0**
- **REGRESSÃO** nav **83/83** · conta **62/62** · pedidos **76/76** · login
  **71/71** · favoritos **43/43** · enderecos **95/95** — todos **PASSA**
- **DIVERGENCIAS** 15 (o beige → `secondary`), 16 (o amber medido), 17 (o botao
  do Avatar 3D como alvo)
- **PENDENCIAS NEON** `customer_size_profiles` (upsert `onConflict: "user_id"`,
  UMA linha por cliente) + `customer_measurement_history` (o EXTRATO, N linhas);
  o `save()` grava nas DUAS e as duas tem que caber na **MESMA transacao** (se o
  `insert` do historico falhar depois do `upsert`, o perfil fica num estado que
  nenhuma linha registra — anotado em `data.ts`); o `user_id` vem da SESSAO
  server-side, nunca do formulario; o `updated_at` alimenta o `Atualizado em`
- **PROXIMO** modulo 9 — Clube VIP & Cashback (`/conta/pontos`)

### O cabecalho de Medidas nao usa o `ClientPageHeader` — pela MESMA razao de Enderecos

E a segunda tela do painel com cabecalho proprio, e o motivo e o mesmo ja provado
no modulo 7: o original declara o cabecalho como o PRIMEIRO filho de um
`space-y-8`, sem margem propria, e o componente compartilhado carrega `mb-6` — o
reuso somaria os dois espacos. A diferenca aqui e que a descricao tem um trecho
com estilo proprio (`Provador Virtual` numa `<span className="text-foreground
font-medium">`), o que sozinho ja impediria a prop de texto puro. A bancada prova
os dois lados: a tela NAO importa o `ClientPageHeader`, e o `md:flex-row` do
container bate com o do original.

### A prova central deste modulo: `CelulaValor` e o `null`

O perfil dos prints tem busto, cintura e quadril VAZIOS, e o tipo os deixa `null`.
A tentacao natural e escrever `{valor} cm` cru, e o `null` sairia como `null cm`
ou `0 cm` — uma medida que ninguem tirou, com cara de medida zero. A bancada
MONTA `CelulaValor` de verdade duas vezes (`59` e `null`) e compara: com numero
sai `59 kg` em serifada com a unidade em caixa alta; com `null` sai VAZIO, e nem a
unidade aparece (`— cm` tambem nao). Foi a razao de o componente existir separado:
um `{valor ?? '—'}` inline seria facil de esquecer num dos quatro campos.

## Checkpoint — modulo 7 (Enderecos)

- **MODULO** Enderecos · **STATUS** PRONTO · **ROTA** `/conta/enderecos`
- **PRINTS** `004726` (`cli-008`, o estado VAZIO e o cabecalho com o botao
  `+ NOVO ENDEREÇO`)
- **ARQUIVOS** `src/app/(cliente)/conta/enderecos/page.tsx` (novo),
  `src/components/cliente/addresses-view.tsx` (novo — `AddressesView` +
  `EnderecoForm` + `ENDERECO_VAZIO`), `src/lib/cliente/types.ts`
  (`EnderecoCliente`), `src/lib/cliente/demo.ts` (`DEMO_ENDERECOS_CLIENTE`),
  `src/lib/cliente/data.ts` (`listEnderecos`, `ResultadoEscrita` e as tres
  escritas)
- **ESTADOS** carregando (`Carregando...`), vazio (bloco tracejado + circulo com
  `MapPin` + `Você ainda não possui endereços cadastrados.`, **sem botao** — o
  print nao mostra nenhum), formulario aberto (criar / editar, com os 10 campos),
  grade de cartoes (selo `Principal`, `Tornar principal`/`Editar`/`Excluir`),
  aviso (sucesso quando o banco entrar; hoje sempre o `reason`)
- **BANCADA** `bench-cliente-enderecos.mjs` **95/95**, `bench-cliente-nav.mjs`
  **83/83**, `bench-cliente-pedidos.mjs` **76/76**, `bench-cliente-conta.mjs`
  **62/62**, `bench-cliente-login.mjs` **71/71**
- **TYPECHECK** `EXIT=0`
- **REGRESSAO** o Admin **nao foi tocado** (`find src/app/admin
  src/components/admin src/lib/admin -newermt "2026-10-03 15:00"` devolve vazio).
  A bancada nasceu com UMA falha, e ela era do INSTRUMENTO: a prova do fundo do
  bloco vazio reusava `blocoVazio[0]`, que inclui o corpo capturado (com
  `bg-secondary/40` do circulo) — media o trecho errado. Corrigida guardando o
  ATRIBUTO `className` separado do corpo; a falha virou ok sem tocar na tela.
  Detalhe na secao "O instrumento media o trecho errado", abaixo
- **DIVERGENCIAS** a 12 e a 13 acima
- **PROXIMO** modulo 8 (Minhas Medidas)

### A medida que fecha a escala em 1x: o botao de `Endereços`

O print `004726` traz o botao `+ NOVO ENDEREÇO` no cabecalho. Medido: caixa de
x 2279 a 2486, y 320 a 367 → **208 x 48 px**. Os 48 px batem exatamente com o
`h-12` que o original declara — e sao a QUINTA medida independente de que a
captura esta em 1x, depois da sidebar (259), da pilula ativa (29), do coracao
(30) e do arco de canto (~26). A conferencia da escala esta na secao propria,
acima; aqui fica so o numero novo, porque ele e deste modulo.

### O cabecalho desta tela NAO usa o `ClientPageHeader` — e isso e de proposito

`Meus Pedidos` e `Favoritos` usam o componente compartilhado. `Endereços` nao
usa, e a bancada exige essa DIFERENCA (uma prova confere que a tela nao importa o
componente; outra confere que o componente usa `md:flex-row`, para a excecao nao
passar por acidente). Duas razoes concretas: o botao `+ NOVO ENDEREÇO` fica na
MESMA linha do titulo, e o original declara esse cabecalho inline dentro de um
container `space-y-8` — reusar o componente somaria o `mb-6` dele ao `space-y-8`
do container (56 px onde o print mostra 32) e trocaria o corte de `sm` por `md`.
Neutralizar o `mb-6` para reusar seria um workaround, e nao uma transcricao.

### O instrumento media o trecho errado

A bancada de `Endereços` nasceu com `93/94` — uma falha, na prova "o bloco
tracejado NAO tem fundo". A tela estava CERTA (o bloco nao tem `bg-`); quem
estava errado era o instrumento. A prova reusava `blocoVazio[0]`, o match
INTEIRO de um regex que captura o corpo do bloco (`...className="...">([\s\S]*?)
</div>`). Como o corpo contem `bg-secondary/40` no circulo, o `!/bg-/` sobre o
match inteiro reprovava sempre — e o texto da falha, que imprimia o match todo,
foi o que denunciou: o `className` do bloco estava limpo e a tinta aparecia no
circulo. Corrigido guardando `classNameVazio` (so o atributo) para esta prova, e
mantendo `blocoVazio[1]` (o corpo) para a prova de ausencia de botao, que precisa
mesmo do corpo. **A licao e a de sempre: um instrumento que mede o trecho errado
reprova a coisa certa — e o remendo tem que ser no instrumento, nao na tela.**

## Checkpoint — modulo 6 (Favoritos)

- **MODULO** Favoritos · **STATUS** PRONTO · **ROTA** `/conta/favoritos`
- **PRINTS** `004717` (`cli-007`, o estado VAZIO — o unico que a tela tem)
- **ARQUIVOS** `src/app/(cliente)/conta/favoritos/page.tsx` (novo),
  `src/components/cliente/favorites-view.tsx` (novo),
  `src/components/cliente/client-page-header.tsx` (campo `className`)
- **ESTADOS** carregando (`Carregando...`), vazio (bloco tracejado + circulo com
  `Heart` + `Sua lista de favoritos está vazia.` + `Explorar a loja`), grade cheia
  (cartao com foto `aspect-[3/4]`, remover, nome, preco, `Carrinho`/`Comprar`) —
  este ultimo vem do ORIGINAL, nao do print, porque o print so mostra o vazio
- **BANCADA** `bench-cliente-favoritos.mjs` **43/43**, `bench-cliente-nav.mjs`
  **83/83**, `bench-cliente-pedidos.mjs` **76/76**, `bench-cliente-conta.mjs`
  **62/62**, `bench-cliente-login.mjs` **71/71**
- **TYPECHECK** `EXIT=0`
- **REGRESSAO** duas bancadas de mutacao, cada uma derrubando EXATAMENTE as
  provas certas (o `diff` da lista confirma 2 provas viradas em cada): trocar o
  titulo para `Meus Favoritos` reprova o titulo e o `mb-8`; trocar
  `bg-secondary/40` por `bg-beige/20` reprova as duas provas da tinta. O Admin
  **nao foi tocado** (`find src/app/admin src/components/admin -newermt "2026-10-03
  14:20"` devolve vazio; a unica coisa fora de `(cliente)` com mtime recente e
  `lib/pedidos/*`, de 13:49, que e o trabalho do modulo 5)
- **DIVERGENCIAS** a 10 e a 11 abaixo
- **PROXIMO** modulo 7 (Enderecos)

### A escala das capturas: era 1x, e a secao anterior estava errada

Este modulo refez a medida, e ela **contraria** o que a secao "Escala das
capturas" dizia (2x). A captura e **1x**, e a soma `12 + 260 + 40 + 2212 + 12 =
2536` continua fechando — ela so mede LARGURAS, e nao um fator de escala. Quatro
medidas independentes dao 1x:

| Medida | Pixel no print | Classe do original | Em 2x seria |
| ------ | -------------- | ------------------ | ----------- |
| Coluna de navegacao | 259 px | `260px` (`lg:grid-cols-[260px_1fr]`) | 520 px |
| Pilula ativa `Meus Pedidos` | 29 px de tinta | `py-3.5` + `text-sm` (~38) | ~76 px |
| Coracao do vazio | 30 x 27 px | `h-8 w-8` (32) | 64 px |
| Raio do canto tracejado | ~26 px | `rounded-[2rem]` (32) | 64 px |

A consequencia pratica: a geometria ja entregue esta **certa pelo motivo certo**
— o original declara em px de CSS e o print mostra esses mesmos numeros em pixel.
A secao foi corrigida no lugar (preservando a soma), e a conclusao de 2x foi
substituida pela de 1x, agora ancorada nas quatro medidas.

### O titulo `Favoritos` (curto) contra a coluna `Meus Favoritos` (longo)

O print `004717` mostra os DOIS ao mesmo tempo: `Favoritos` no painel de conteudo
e `Meus Favoritos` no item da coluna. Nao e divergencia a resolver — sao dois
rotulos em dois lugares, e os dois estao no material:

- `conta.favoritos.tsx` escreve `<h2 className="font-serif text-3xl mb-8">Favoritos</h2>`
- `AccountLayout.tsx` (a casca) escreve `Meus Favoritos` no item da coluna

A tela usa o curto; a coluna (`nav.ts`) usa o longo. A bancada prova os dois
lados do par, e a contraprova confirma que o texto curto **nao contem** o longo —
senao a prova seria cega.

### O `mb-8` foi para dentro do cabecalho

`conta.favoritos.tsx` e a UNICA tela desta area cujo `<h2>` declara margem propria
(`mb-8`). As outras (`Pedidos`, `Cupons`, `Dados da Conta`, `Seguranca`) escrevem
o `<h2>` sem margem. Como o `ClientPageHeader` ja carrega o espaco padrao entre
titulo e conteudo, a tela passar um `mb-8` por fora daria DOIS espacos — e o print
mostra um. O ajuste entra pelo novo campo `className` do cabecalho (unico ponto de
mudanca, sem alterar o padrao das outras telas).

### A tinta do `beige`: o material desmente o proprio original

O original declara `bg-beige/5` na caixa e `bg-beige/20` no circulo. O `beige` do
projeto original e `oklch(0.95 0.018 70)`. A 5% sobre branco isso da (255,254,254)
e a 20% da (253,251,249) — 1 a 2 unidades. O print `004717`, amostrado, mostra
**branco puro (255,255,255) nos dois**: a media do interior da caixa e
(254,94;254,94;254,94) e as amostras dentro e fora do circulo dao (255,255,255).
A 3200% de zoom, o circulo simplesmente nao aparece — so o coracao.

O projeto `closet-lunnar` tambem **nao tem** o token `beige`. Entao: a caixa fica
**sem fundo**, e o circulo usa `bg-secondary/40` — `--secondary` e `33 30% 95%`, o
mesmo 95% de luminosidade, entao o desenho e o mesmo e a tinta e a que o navegador
pintaria. A FORMA (raio `rounded-[2rem]`, tracejado, circulo `size-16`, coracao
claro `/40`) e transcrita; a tinta nao se inventa. E a mesma decisao que o
`Stat.tsx` do admin ja registra, e a mesma conversao ja usada no vazio de
`Pedidos` — o original escreve os dois blocos identicos.

### Os botoes do ramo cheio sao alvo, nao fluxo

`Carrinho`, `Comprar` e o botao de remover dependem de dois contratos que so
existem na LOJA (`useCart`, `useWishlist`) — e a loja entra na Fase 3. Recriar um
`useCart` local seria a segunda implementacao do mesmo conceito, que a Fase 4
proibe. Os botoes ficam com a forma e o texto do original e **sem handler** — o
mesmo tratamento dos dois botoes de `PedidoCard`, que no original tambem nao tem
`onClick`. A bancada exige `<button>` E a ausencia de `onClick`/`useCart`.

## Checkpoint — modulo 5 (Meus Pedidos)

- **MODULO** Meus Pedidos · **STATUS** PRONTO · **ROTA** `/conta/pedidos`
- **PRINTS** `004649` (`cli-004`, lista), `004701` (`cli-005`, rolado)
- **ARQUIVOS** `src/app/(cliente)/conta/pedidos/page.tsx` (novo),
  `src/components/cliente/orders-view.tsx` (novo),
  `src/components/cliente/pedido-card.tsx` (novo),
  `src/lib/cliente/metrics.ts` (a projecao do frete),
  `src/lib/pedidos/types.ts` (campo `shipmentMethod`),
  `src/lib/pedidos/demo.ts` (o campo nos 6 pedidos)
- **ESTADOS** carregando (`Carregando...`), preenchido (5 cartoes),
  cartao fechado, cartao aberto com itens, cartao aberto SEM itens
  (`Sem itens registrados.`), lista vazia (bloco tracejado + `Começar a comprar`),
  sem desconto (linha ausente), sem frete no resumo (linha ausente)
- **BANCADA** `bench-cliente-pedidos.mjs` **76/76**, `bench-cliente-conta.mjs`
  **62/62**, `bench-cliente-nav.mjs` **83/83**, `bench-cliente-login.mjs`
  **71/71**
- **TYPECHECK** `EXIT=0`
- **REGRESSAO** duas bancadas de mutacao: trocar o estado do accordion para
  `Set`-like reprova; trocar `frete` de volta para `carrier` derruba 5 provas.
  O Admin **nao foi tocado** (`find src/app/admin src/components/admin
  -newermt "2026-10-03 13:00"` devolve vazio)
- **DIVERGENCIAS** a 8 e a 9 abaixo
- **PROXIMO** modulo 6 (Favoritos)

### O campo que este modulo teve que acrescentar ao modelo do Admin

A tela escreve `me:1` na linha do caminhao. Isso e a coluna **crua**
`shipping_method` de `orders`, e **nao** o nome da transportadora: o print
`004649` mostra `me:1` num pedido cuja transportadora e `Correios`, e `Correios`
nao aparece em lugar nenhum da area da cliente.

O modelo do admin (modulo 6 da fase 1) guardava so `kind` e `carrier`, e
`kind` **nao reproduz o print**: `me:1` e `own:341d5a3a-…` seriam os dois
`transportadora`/`propria`, e o print mostra strings diferentes.

As duas saidas, e a que foi tomada:

1. guardar o campo em `cliente/types.ts` — **rejeitada**: seriam dois modelos
   para a mesma coluna `orders`, exatamente o que a Fase 4 proibe;
2. acrescentar `shipmentMethod: string | null` ao `OrderShipping`
   **compartilhado** — **tomada**.

O campo e ADITIVO: nenhum campo existente mudou de sentido, nenhuma tela foi
redesenhada e **nenhum arquivo do admin le o campo novo** — a bancada varre os
164 arquivos de `app/admin` e `components/admin` e exige zero leituras. Ele
respeita "NAO reescreva as interfaces" porque acrescenta, e nao substitui.

Isso corrigiu, de passagem, uma prova do modulo 4 que ficara **codificando o
contrato antigo** (`p.frete === bruto.shipping.carrier`). Ela nao foi apagada: foi
atualizada para o campo certo, com a forma antiga transcrita no comentario — o dia
em que alguem "consertar" `frete` de volta para o nome, o material volta a
contradizer a tela.

### Os dois blocos de rastreio que o original declara e NAO desenha

O `conta.pedidos.tsx` tem dois blocos entre a linha e o painel: o de Entrega
Propria (com `Acompanhar entregador`) e o do Melhor Envio (com `Rastrear pedido`).
Os dois sao governados por busca de PALAVRA no `shipping_method`:

```
isOwnDelivery = (...).includes("propria") || (...).includes("própria") || (...).includes("local")
isMelhorEnvio = (...).includes("melhor")
```

O dado que a tela recebe e `me:1` e `own:341d5a3a-…`. Nenhuma das duas strings
contem `melhor`, `propria` nem `local` — **as duas condicoes sao falsas**, e com o
material que existe os blocos simplesmente nao aparecem. A bancada reimplementa as
duas condicoes literalmente e as roda contra os cinco pedidos: zero casamentos.
Por isso a tela esta sem eles, e isso e fidelidade — nao omissao.

Corrigir o predicado para `me:`/`own:` seria inferir o formato do identificador a
partir de duas amostras — e os blocos precisam de tres campos que o modelo nao tem
(`tracking_url`, `delivery_status`, `delivery_tracker_url`). Criar um segundo
modelo so para eles e o que a Fase 4 proibe. Fica registrado como pendencia.

## Checkpoint — modulo 4 (Dashboard)

- **MODULO** Dashboard · **STATUS** PRONTO · **ROTA** `/conta`
- **PRINTS** `004603` (topo), `004612`, `004641` (rolado)
- **ARQUIVOS** `src/app/(cliente)/conta/page.tsx`,
  `src/components/cliente/dashboard-view.tsx`, `clube-nivel-card.tsx`,
  `cupons-ativos-card.tsx`, `ultimo-pedido-card.tsx`, `account-quick-link.tsx`,
  `conta-section-card.tsx`, `src/components/ui/stat.tsx` (compartilhado, novo)
- **ESTADOS** carregando (sem numero nenhum na tela), preenchido, sem pedido,
  sem cupom, sem nivel cadastrado (fallback `Afiliada`)
- **BANCADA** `bench-cliente-conta.mjs` **61/61**, `bench-cliente-nav.mjs`
  **83/83**
- **TYPECHECK** `EXIT=0`
- **REGRESSAO** `stat.tsx` e novo e so a area da cliente o importa; o Admin nao
  foi tocado (`find src -newermt "2026-10-03"` devolve so a area da cliente, o
  `globals.css` e as duas bancadas)
- **DIVERGENCIAS** a 1 e a 5 acima, e a 6 abaixo
- **PROXIMO** modulo 3 (Login, demo) — ver nota abaixo

### A correcao que este modulo produziu: os cupons

O Dashboard nasceu com um filtro de validade (`cuponsValidos`) que era
**invencao minha**. Ele parecia obvio — "Cupons ativos" filtrando por validade —
e derrubou a bancada na primeira execucao.

As fontes dizem o contrario. O original consulta
`coupons.select("*").eq("is_active", true)`, **sem `expires_at`**. E os prints
provam o resultado: `004603` mostra o `CLOSET10` no cartao `Cupons ativos` e
`004841` mostra o MESMO cupom escurecido como `EXPIRADO`, dois minutos e meio
depois, na mesma sessao. Um filtro por validade nao consegue produzir os dois
estados; `is_active` sim.

O que mudou:

- `cuponsValidos` e `cupomValido` **removidos**; entrou `cupomFechado(cupom,
  agora)`, que e o veredito do cartao escurecido de `/conta/cupons`.
- `getResumo()` **perdeu o parametro de data** — o cartao nao depende de "hoje".
- `dashboard-view.tsx` deixou de ler o relogio.
- `rotuloMinimo` **removido**: nao era usado por ninguem (codigo morto).

Fica registrado como **pendencia para o modulo 10 (Cupons)**: a lista precisa
ler o relogio do navegador para escurecer o vencido, e `cupomFechado` ja esta
pronta para isso.

## Checkpoint — modulo 3 (Login, demo)

- **MODULO** Login · **STATUS** PRONTO · **ROTA** nenhuma — e a PORTA de `/conta`
- **PRINTS** *nenhum* — a tela nao tem captura; a referencia e o
  `CustomerLogin.tsx` do original, e o efeito dela (o aviso `Bem-vinda de volta!`
  do print `004603`/`cli-001`)
- **ARQUIVOS** `src/lib/cliente/login.ts` (novo),
  `src/components/cliente/customer-login.tsx` (novo),
  `src/components/cliente/cliente-toast.tsx` (novo),
  `src/components/cliente/account-shell.tsx` (ganhou o portao)
- **ESTADOS** Entrar (2 campos + `Manter conectado`), Criar conta (4 campos),
  recusa (aviso vermelho), sucesso (aviso verde + entra), esqueci-a-senha sem
  e-mail (aviso vermelho)
- **BANCADA** `bench-cliente-login.mjs` **71/71**, `bench-cliente-nav.mjs`
  **83/83**, `bench-cliente-conta.mjs` **61/61**
- **TYPECHECK** `EXIT=0`
- **REGRESSAO** so arquivos da area da cliente; o Admin nao foi tocado
  (`find src/app/admin src/components/admin -newermt "2026-10-03"` devolve
  vazio) e o `globals.css` segue sem nenhuma referencia ao cliente
  (`grep -ci "cliente|minha conta|data-cliente"` → **0**)
- **DIVERGENCIAS** a 6 e a 7 acima
- **PROXIMO** modulo 5 (Meus Pedidos) — a fila do `MAPA-CLIENTE.md`

### Decisoes deste modulo, e por que cada uma

**A tela NAO tem print — a estrutura inteira vem do original.** O unico vestigio
dela no material e o aviso que ela produz (o `Bem-vinda de volta!` de `cli-001`).
Entao cada campo, rotulo e atributo foi transcrito do `CustomerLogin.tsx`, e a
bancada prova a transcricao declaracao por declaracao, contra o proprio arquivo
do original. Onde o original nao escreve nada, nao se escreveu: nao ha nenhuma
frase de recusa inventada em `login.ts` — a unica mensagem e `ERRO_CREDENCIAL`,
que e o `toast.error` do original.

**O login e PORTA, nao rota.** O original faz
`if (!user) return <CustomerLogin />;` dentro do layout (`AccountLayout.tsx`
linha 42). Nao ha `/conta/login`. Reproduzir isso na casca mantem a URL identica
a do material; criar a rota seria inventar um endereco que o material nao tem.

**O portao nasce ABERTO (`useState(true)`).** O material comeca com a cliente ja
dentro (o print `cli-001` e o Dashboard), e a sessao de demonstracao existe
(`getConta()` devolve a conta dos prints). Abrir no portao contradiria o unico
estado que os prints provam. Ele fecha em `Sair` e reabre em `ENTRAR` — as duas
transicoes sao exigidas pela bancada, porque uma guarda sem caminho de volta
deixaria a area inalcancavel para sempre.

**`cliente-toast.tsx` e um componente so para as duas cores.** O projeto nao tem
biblioteca de avisos — a convencao e desenhar (o `checklist-toast.tsx` do admin e
o `aviso` do carrinho abandonado). Um segundo componente so para o erro divergiria
no primeiro ajuste, entao o `tom` e um parametro.

**A validacao esta em `lib/`, nao no `onSubmit`.** Um `if` dentro de um `onSubmit`
so se prova clicando; uma funcao pura se prova chamando. A bancada chama
`validarLogin` nove vezes, nos dois sentidos, e prova que um `sempre aprova`
falharia.

## Ordem de execucao — o Login ficou para depois do Dashboard

A fila do `MAPA-CLIENTE.md` poe o Login como modulo 3, entre a casca e o
Dashboard. Ele foi adiado na primeira passada (o Dashboard ja estava com os
arquivos escritos, e trocar de modulo no meio teria deixado uma tela pela
metade) e foi **concluido agora** — ver o checkpoint do modulo 3 acima.

## Pendencia de print — RESOLVIDA no modulo 3

O print `cli-001` mostra um **aviso** flutuante no canto superior direito —
`Bem-vinda de volta!`, com icone de confirmacao e fundo verde-claro. Ele era a
unica pendencia de print desta fase, e pertencia ao Login.

Agora ele e renderizado: `components/cliente/cliente-toast.tsx`, mostrado pelo
formulario quando o envio passa na validacao. O texto vem de
`lib/cliente/sessao.ts` (`MENSAGEM_ENTROU`), que e o mesmo que a bancada do
login prende. A cor e o token `--success` — ver a divergencia 6.

## Pendencias para o Neon

Todas as leituras devolvem `source: 'demo'` e um `reason` explicando o motivo. A
area nao toca banco, `DATABASE_URL` nem `process.env` (provado na secao 7 da
bancada). O que falta ligar:

- `getSession()` e de demonstracao: a conta e sempre `lp070087@gmail.com`.
- **A entrada nao autentica.** `validarLogin` confere SO a forma dos campos; nao
  ha senha para conferir. Quando o provedor entrar, `entrar()` (em
  `lib/cliente/login.ts`) passa a devolver erro de credencial e o portao da casca
  passa a ler a sessao real. O `localStorage`/`sessionStorage` do original
  (`customer-session-only`, `customer-session-alive`) NAO foi reproduzido: sem
  provedor, gravar no navegador faria a proxima abertura parecer autenticada sem
  nada ter sido conferido.
- Os pedidos vem de `@/lib/pedidos/demo` filtrados por `customer.email`.
- Favoritos nascem vazios (o print mostra a tela vazia).
- `DEMO_CASHBACK` e numero fixo do print (`R$ 10,14`), NAO calculado — a regra do
  programa de fidelidade pertence a tela de Fidelidade do admin e ainda nao foi
  transcrita para `cliente`.
- O cupom `CLOSET10` venceu em 20/08/2026 de proposito: e o estado que o print
  `004841` documenta na lista.
- `Cupons`: a tela le a tabela `coupons` — a MESMA que o admin edita — com
  `is_active = true`, ordenada por `created_at desc` (o mesmo `order` do
  original). O `minimo` do cupom do material e **ZERO**: `adm-012` imprime `—` na
  coluna `MÍN.` (que e como o admin escreve zero) e a linha de meta do `cli-015`
  tem so dois termos. O campo era `150` sem fonte e foi corrigido — ver a
  divergencia 22.
- `Cupons`: o `disabled` do cartao tem DUAS causas, `expired || exhausted`. O
  `expired` compara `expires_at` com o relogio do CLIENTE (a data e `timestamptz`,
  e o "hoje" que vale e o da cliente) — a tela le o relogio uma vez, num efeito,
  e passa a data para a funcao pura. O `exhausted` e
  `max_uses != null && uses_count >= max_uses`, os dois campos que o admin ja
  guarda (`maxUses` e `usesCount`). `uses_count` e escrito pelo CHECKOUT, nunca
  pela tela.
- `Cupons`: `Expirado` e `Esgotado` sao condicoes INDEPENDENTES e podem aparecer
  juntas — o original escreve os dois `<span>` separados, e nao um `else`. A
  traducao mantem os dois.
- `Cupons`: a copia usa `navigator.clipboard.writeText`, que e API do NAVEGADOR e
  **nao** uma escrita no banco — ela funciona hoje e nao vira pendencia do Neon.
  O `?.` e o `.catch` ficam: fora de contexto seguro o `clipboard` e `undefined`
  e o `writeText` rejeita. Ver a divergencia 23.
- `Dados da Conta`: a conta de demonstracao tem `nomeCompleto: null` e
  `telefone: null`, e e por isso que o `NOME COMPLETO` sai vazio e o
  `TELEFONE / WHATSAPP` mostra o `placeholder` — exatamente como o print. Quando a
  sessao real entrar, os dois vem de `user_metadata.full_name` e
  `user_metadata.phone`.
- `Dados da Conta`: **esta escrita nao vira um `update` de tabela.** O original
  chama `supabase.auth.updateUser({ data: { full_name, phone } })` — o `name` e o
  `phone` **nao sao colunas de `customers`**, sao metadados da CONTA. A assinatura
  de `salvarDadosConta` fica igual a das outras; o CORPO e que troca de dono (o
  provedor de auth, e nao o Prisma). Ver a nota longa em `data.ts`.
- `Dados da Conta`: trocar o E-MAIL nao troca o e-mail. O provedor manda um link
  de confirmacao para o endereco NOVO e a conta continua ativa com o antigo ate a
  confirmacao — e por isso o original tem DOIS avisos de sucesso
  (`Confirme o novo e-mail na sua caixa de entrada.` quando mudou, `Dados
  atualizados` quando nao). A tela ja implementa a diferenca; ela fica inalcancavel
  ate o provedor existir. Um `Dados atualizados` depois de trocar o e-mail seria
  uma mentira — o e-mail ainda e o antigo.
- `Dados da Conta`: o `disabled`/`SALVANDO...` do original **saiu**, porque a
  escrita de demonstracao responde no mesmo tique e o estado nunca apareceria na
  tela. A CLASSE `disabled:opacity-50` ficou no lugar, para a aparencia ja estar
  pronta quando o `saving` voltar. Ver a nota no topo de `account-view.tsx`.
- `Dados da Conta`: a tela NAO atualiza o proprio `conta` depois de salvar. Se
  atualizasse, o segundo clique compararia o e-mail contra o valor ja "aceito" e o
  aviso de confirmacao se calaria — mostrando `Dados atualizados` para um e-mail
  que ainda nao foi confirmado. Este ponto e o que muda quando o provedor entrar.
- `--placeholder` (token novo, compartilhado com o admin): a tinta do placeholder
  nao existe no original. Ela fica registrada aqui porque e uma cor de PIXEL que
  o tema agora carrega, e porque a bancada do modulo 11 a prova contra o valor
  medido no print ((137,135,134) -> `0 0% 54%`). Se algum dia o admin quiser usar
  `text-placeholder`, a cor ja e a medida — e nao uma escolha nova.
- `DEMO_NIVEIS_CLUBE` tem os QUATRO niveis do `cli-013` (Bronze 0, Prata 1000,
  Ouro 3000, Diamante 7000). `DEMO_NIVEL_CLUBE` e o `Bronze` — o MESMO objeto,
  por identidade, para o Dashboard e o Clube nao mostrarem cores diferentes. A
  lista real vem de `loyalty_tiers` e a cor da COLUNA `color`; as cores de hoje
  sao medidas dos prints (o Bronze, na faixa solida; os outros, na tinta do
  trofeu — aproximacoes). Ver a divergencia 21.
- `Clube VIP & Cashback`: TRES tabelas — `loyalty_tiers` (nome, `color`,
  `min_points`, `benefits` jsonb), `loyalty_points` (o extrato: `type`, `points`,
  `description`, `created_at`, por cliente) e `loyalty_config` (as chaves
  `rewards` e `general_rules`). O RESGATE sao DUAS escritas — o debito em
  `loyalty_points` (`type: 'redeem'`) e o CUPOM de uso unico —, e as duas tem que
  caber na **MESMA transacao**: se o cupom falhar depois do debito, a cliente
  perde os pontos sem receber nada. A assinatura e uma (`resgatarRecompensa`), o
  efeito e duplo; a nota esta em `data.ts` e a bancada a exige.
- `Clube VIP & Cashback`: `points` NAO e sempre positivo — em `adjustment` o sinal
  vem no proprio numero. O saldo tem que usar o TIPO para decidir se entra e a
  MAGNITUDE para decidir quanto (`movimentoEntra` + `magnitudePontos`,
  `metrics.ts`), senao o ajuste negativo e somado em vez de subtraido. Ver a
  divergencia 18 — o saldo do original carrega esse defeito.
- `Clube VIP & Cashback`: o `Seu Saldo` e o `Meus Pontos` do Dashboard sao
  derivados do MESMO extrato (`saldoPontosDoExtrato`), pelo mesmo motivo de
  `DEMO_NIVEL_CLUBE` ser o mesmo objeto: duas telas que mostram o mesmo numero nao
  podem ter duas contas.
- `getResumo()` nao recebe data: o cartao de cupons do dashboard filtra por
  `is_active`, como a consulta do original.
- `Meus Pedidos` le `shipment_method` cru, e o campo ja existe no modelo
  (`shipmentMethod`). Faltam `tracking_url`, `delivery_status` e
  `delivery_tracker_url` para os dois blocos de rastreio — ver a divergencia 9.
- Os dois botoes do painel aberto (`Acompanhar entrega`, `Preciso de ajuda`) **nao
  tem `onClick` no proprio original**. Ficam como alvo, e nao como fluxo, ate
  existir print da acao.
- `Favoritos`: a tabela `wishlist` entra vazia neste banco. As ACOES do ramo cheio
  (`Carrinho`, `Comprar`, remover) dependem de `useCart`/`useWishlist`, que sao da
  LOJA — entram na Fase 3. Ate la os botoes sao alvo, sem handler (como no
  original, que tambem nao os liga a nada na conta).
- `Endereços`: a tabela `customer_addresses` entra VAZIA (a conta dos prints nao
  tem endereco). As tres escritas ja existem com a assinatura pronta
  (`salvarEndereco`, `excluirEndereco`, `marcarEnderecoPrincipal`) e hoje devolvem
  `{ ok: false, reason: PENDING_REASON }` — o corpo muda para a chamada ao Prisma,
  a assinatura nao. Quando elas passarem a gravar, **`user_id` NAO pode vir do
  navegador**: o original manda `user_id: user.id` do cliente Supabase, e na Fase
  4 a escrita tem que derivar a sessao SERVER-SIDE e ignorar qualquer `user_id`
  que chegue do browser. O `is_default` precisa da MESMA transacao que zera os
  outros (o original faz dois `update` separados, que podem falhar no meio e
  deixar dois principais ou nenhum) — corrigir na traducao.
- `Endereços` / CEP: a consulta `viacep` volta quando o formulario gravar (ver
  divergencia 12). Enquanto isso o campo e manual. O `confirm()` de exclusao volta
  junto (divergencia 13).
- `Endereços`: o formulario NAO fecha ao salvar. Quando a escrita gravar, o ramo
  `ok: true` fecha — o mesmo lugar do original (`setEditing(null); setCreating(false)`).
  Hoje ele fica aberto de proposito, porque nada foi salvo e fechar mentiria.
- `Minhas Medidas`: DUAS tabelas — `customer_size_profiles` (o estado atual,
  `upsert` com `onConflict: "user_id"`, UMA linha por cliente) e
  `customer_measurement_history` (o EXTRATO, N linhas). O `save()` do original
  grava nas DUAS: um `upsert` no perfil e um `insert` no historico com o MESMO
  payload. **As duas escritas tem que caber na MESMA transacao** — se o `insert`
  falhar depois do `upsert`, o perfil fica num estado que nenhuma linha do
  historico registra, e o `Atualizado em` mente. A nota esta em `data.ts`, e a
  bancada a exige. O `user_id` **vem da sessao server-side**, nunca do formulario
  (o original manda `user_id: user.id` do Supabase; na Fase 4 a escrita deriva a
  sessao e ignora o que chegar do browser). A conversao `string → number | null`
  acontece na fronteira de `data.ts` (o `<input>` da string, o banco guarda
  numero), e o `Há quanto tempo?` so persiste quando `practices_activity` e `true`.
- `Minhas Medidas`: o `usual_size` e `null` na conta dos prints, e o cartao escuro
  escreve `Aguardando dados`. Quando o banco tiver o tamanho, o ramo `Tamanho
  {usual_size}` aparece — o tipo ja e `string | null` e a tela ja tem os dois lados.
- `Minhas Medidas`: o botao `VER NO AVATAR 3D` nao tem `onClick` (divergencia 17).
  Ele liga em `openFitting()` do `FittingRoomContext` do SITE, que entra na Fase 6
  (modulo `Provador e IA`). Ate la ele e alvo, como os botoes de `Favoritos` e os
  dois de rastreio de `Meus Pedidos`.

- `Segurança`: o `Último Login` vem de `auth.users.last_sign_in_at` — e NAO de um
  relogio da aplicacao. O tipo `AcessoConta.ultimoAcessoEm` e `string | null`, e o
  `null` nao e um estado de carregamento: e "nenhum acesso registrado", e a tela
  escreve `—`. Um valor inventado ali seria pior do que a ausencia, porque
  pareceria um acesso real. **A formatacao vem do provedor com fuso explicito.**
  `ultimoAcesso()` usa `getDate()`/`getHours()` LOCAIS, escolha registrada em
  `metrics.ts`: a cliente e brasileira, e a fase de demonstracao roda no fuso da
  maquina. Quando o Neon entrar, o servidor formata com `America/Sao_Paulo`
  fixado — o runtime da Vercel e UTC, e sem o fuso a hora sairia deslocada.
- `Segurança`: `salvarSenha()` e `encerrarSessoes()` devolvem `{ ok: false }` com
  o motivo pendente. As duas contam com **provedor de autenticacao**, que nao
  existe nesta fase. `salvarSenha` NAO recebe a senha por parametro — a senha vai
  do formulario direto para a chamada de auth, sem tocar um tipo do dominio.
  `encerrarSessoes` e diferente de `sairDaConta` (aba): o original usa
  `signOut({ scope: "global" })`, que encerra em TODOS os aparelhos. O `Logout` da
  barra tracejada usa `sair` — o da aba, e nao o global.
- `Segurança`: a confirmacao desenhada (`confirmando`) substitui o `confirm()` do
  original. Quando o encerramento global for REAL, o padrao costuma ser uma caixa
  do sistema ou um dialogo modal — a faixa desenhada continua valida, mas a fase de
  integracao deve decidir se mantem a forma ou volta ao nativo (que a bancada nao
  consegue testar).
- `Segurança`: o `saving` foi removido (a escrita volta no mesmo tique), mas
  `disabled:opacity-50` ficou. Quando a chamada for assincrona de verdade, o
  `PROCESSANDO...` do original e o estado voltam — a classe ja esta pronta.

- `Afiliada`: `getAfiliada()` casa o **e-mail da sessao** com `affiliate_profiles`.
  Na Fase 4 a busca passa a ser por `affiliate_profiles.user_id = sessao.user_id`
  — derivado da sessao server-side, e nunca de um id que chegue do navegador (a
  regra de `NÃO confiar em customerId vindo do navegador`). O `perfil: null`
  (conta que ainda nao e afiliada) continua sendo um ESTADO, e nao um erro.
- `Afiliada`: `affiliate_sales` e `affiliate_referrals` estao VAZIAS na
  demonstracao — a bancada prova as duas ausencias. Os quatro numeros do painel
  (cliques, vendas, saldo, a receber) sao, hoje, `0/0/R$ 0,00/R$ 0,00`; o estado
  do historico e o VAZIO. O que a tela MOSTRA na demonstracao, porem, e o CONVITE:
  o e-mail da sessao (`lp070087@gmail.com`) nao esta em `DEMO_AFFILIATES` (a unica
  afiliada la e `lucasmuniz19w@gmail.com`). Isso nao e um buraco — e a referencia,
  que nao tem nenhum print do painel preenchido.
- `Afiliada`: **`referral_slug` e o dado que faz o link existir.** Sem ele a tela
  NAO consegue montar `/?ref=<slug>` e cai na origem sozinha — um link de
  divulgacao que nao rastreia indicacao nenhuma. A coluna existe no admin
  (`lib/afiliadas`), mas nao ha dado de demonstracao; o painel entra vazio por
  isso. A bancada prova o comportamento dos quatro ramos (com/sem slug x com/sem
  origem) para que o defeito nao chegue mudo na integracao.
- `Afiliada`: o **`Copiar`** precisa de `navigator.clipboard`, que so existe no
  navegador e so funciona em contexto seguro (HTTPS ou `localhost`). A copia entra
  na fase de integracao, junto com o dominio publico que a Fase 3 vai criar: sem
  site, o link relativo nao tem o que copiar de util. O `Quero me cadastrar agora`
  depende de um fluxo de **cadastro de afiliada** que nao existe em nenhuma fase
  — quando existir, ele deixa de ser botao sem `onClick`.

Nenhuma LEITURA falta na area: as telas entregues leem tudo por `data.ts`. As
ESCRITAS entram junto com as telas que as usam, como manda o protocolo — e as de
`Endereços` sao o primeiro exemplo disso (existem, mas devolvem `ok: false` com
motivo, em vez de um sucesso falso).

## Alteracoes em arquivos compartilhados com o Admin

**Duas, e as duas no modulo 11.** Este paragrafo ANTES dizia "nenhuma, e o
`globals.css` nao foi alterado" — e isso deixou de ser verdade quando o modulo 11
acrescentou `--placeholder`. A correcao esta registrada aqui em vez de apagada,
porque uma secao que afirma "nenhuma alteracao" e a pior especie de memoria
stale: ela faz a proxima fase parar de conferir.

**O modulo 12 nao alterou nenhum arquivo compartilhado.** A unica alteracao do
modulo foi em `components/cliente/account-shell.tsx`, que e da PROPRIA area da
cliente — o `PortaoDaConta`. `globals.css` e `tailwind.config.ts` nao foram
tocados neste modulo: a tela usa `--danger` e `bg-secondary/30`, que ja existiam.
Isso e o que o `find` sobre os tres diretorios do admin confirma — vazio.

**O modulo 13 tambem nao alterou nenhum arquivo compartilhado com o Admin.** O
modulo tocou `lib/cliente/{types,metrics,data}.ts`, que sao da area da cliente, e
criou a view e a rota. A ligacao com o admin e uma IMPORTAcao de mao unica —
`data.ts` le `DEMO_AFFILIATES` de `@/lib/afiliadas/demo` e a view usa
`formatCommission` de `@/lib/afiliadas/metrics` —, e importar NAO altera o
arquivo importado. Isso e o que o `find` sobre os tres diretorios do admin
confirma: nenhum arquivo do admin com data de hoje.

**1. `src/app/globals.css` — o token `--placeholder`.** O modulo 11 mediu a tinta
do `placeholder` do telefone no `cli-017` ((137,135,134), um cinza NEUTRO) e
achou que ela NAO e o padrao do navegador (que herdaria o `color` com opacidade,
~117,117,117) nem o `--muted-foreground` (105,98,93) dos rotulos. Sem token, essa
seria a unica cor da area que ninguem decidiu. O valor somado e uma VARIAVEL NOVA
(`--placeholder: 0 0% 54%`) e nada mais — nenhuma regra existente mudou de valor.
O bloco com escopo `[data-cliente-area]` que uma rodada anterior tinha deixado
**continua removido**: `grep -ci "cliente|minha conta|account|data-cliente"
src/app/globals.css` ainda devolve **0**.

**2. `tailwind.config.ts` — a chave `placeholder`.** A chave
`colors.placeholder` foi acrescentada para expor o token acima como a classe
`text-placeholder`. E uma chave ADICIONADA ao tema; nenhuma cor existente mudou
de valor.

**Como as duas foram conferidas:** os arquivos do painel do admin nao tem um
unico arquivo modificado (`find src/app/admin src/components/admin src/lib/admin
-newermt "2026-10-03 16:00"` devolve vazio), a bancada do admin continua verde
(`bench-cupons.mjs` **65 provas, 0 falha(s)**), e as bancadas da area da cliente
passam — inclusive as nove que antecedem o modulo 12, que sao as que poderiam
acusar uma chave de tema mexida por engano.

## Escala das capturas — resolvida

A captura esta em **1x**. A soma `12 + 260 + 40 + 2212 + 12 = 2536` fecha (quatro
bordas de cartao na cor `--border` (233,227,223) em x = 10, 269, 310 e 2522), mas
ela mede LARGURAS de pixel — nao um fator de escala. O fator vem de medir a tinta
contra as classes do original, e todo lugar que se mede da 1x: a coluna de
navegacao ocupa 259 px de pixel contra o `260px` declarado; a pilula ativa mede
29 px de tinta contra `py-3.5`+`text-sm`; o coracao do vazio mede 30 px contra
`h-8` (32); o raio do canto tracejado mede ~26 px contra `rounded-[2rem]` (32).
Em 2x cada um desses dobraria.

**A tipografia nao amplia por causa disso.** O original declara `text-5xl` no
`Ola`, e a tinta medida e a do tamanho que a classe declara — nao metade dele.
Foi essa conferencia que fez o bloco do `globals.css` sair: nao era a escala que
pedia tamanho diferente, era a conclusao de que ela estava dobrada.

Esta secao substitui duas notas anteriores. A primeira dizia "a captura e 1x"; a
segunda, ao encontrar a soma que fecha, concluiu "2x" e derrubou a primeira — mas
a soma nao prova escala. A leitura correta e a de 1x, e agora ela esta ancorada
em quatro medidas independentes (largura da coluna, pilula ativa, tinta do
coracao, raio do canto), e nao numa inferencia sobre larguras.

As unicas adaptacoes de escopo do cliente vivem em `components/cliente/`, nao no
CSS global.

## Arquivos da area da cliente (modulos 1 a 13)

- `src/lib/cliente/` — `nav.ts`, `types.ts`, `demo.ts`, `metrics.ts`, `data.ts`,
  `sessao.ts`, `login.ts`
- `src/components/cliente/` — `account-shell.tsx`, `account-sidebar.tsx`,
  `account-mobile-nav.tsx`, `store-header.tsx`, `store-footer.tsx`,
  `client-page-header.tsx`, `conta-section-card.tsx`, `dashboard-view.tsx`,
  `ultimo-pedido-card.tsx`, `cupons-ativos-card.tsx`, `clube-nivel-card.tsx`,
  `account-quick-link.tsx`, `customer-login.tsx`, `cliente-toast.tsx`,
  `orders-view.tsx`, `pedido-card.tsx`, `favorites-view.tsx`,
  `addresses-view.tsx` (`AddressesView` + `EnderecoForm` + `ENDERECO_VAZIO`),
  `measures-view.tsx` (`MeasuresView` + `FIELDS` + `TAMANHOS` + `BotaoSimNao` +
  `CelulaValor`),
  `clube-view.tsx` (`ClubeView` + `LinhaExtrato` + `CartaoRecompensa` +
  `entradaDePontos`),
  `coupons-view.tsx` (`CouponsView` + `CartaoCupom` + `VazioCupons` +
  `cartaoFechado`),
  `account-view.tsx` (`AccountView` + `CampoDados` + `CartaoAviso`),
  `seguranca-view.tsx` (`SegurancaView` + `CampoSenha` + `SeloIcone` +
  `CabecalhoCartao` + `validarSenha` + `PERGUNTA_ENCERRAR`),
  `afiliada-view.tsx` (`AfiliadaView` + `ConviteAfiliada` + `PainelAfiliada` +
  `CartaoMetrica` + `LinhaVenda` + `VazioVendas` + `TITULO_CONVITE`)
- `src/components/ui/` — `stat.tsx` (**compartilhado**: o admin tem os proprios
  cartoes de metrica; este foi criado para a area da cliente e e generico de
  proposito, sem cor fixa e sem cartao proprio)
- `src/app/(cliente)/conta/` — `layout.tsx` (Server), `layout-client.tsx`,
  `page.tsx` (Dashboard), `pedidos/page.tsx` (Meus Pedidos),
  `favoritos/page.tsx` (Favoritos), `enderecos/page.tsx` (Enderecos),
  `medidas/page.tsx` (Minhas Medidas), `pontos/page.tsx` (Clube VIP & Cashback),
  `cupons/page.tsx` (Cupons), `dados/page.tsx` (Dados da Conta),
  `seguranca/page.tsx` (Seguranca), `afiliada/page.tsx` (Afiliada)
- `src/lib/pedidos/` — `types.ts` e `demo.ts` **compartilhados com o Admin**:
  ganharam o campo aditivo `shipmentMethod` no modulo 5 (ver acima). Nenhuma tela
  do admin o le.

`StoreHeader` e `StoreFooter` sao APOIO DECLARADO: substituem o site publico, que
esta fora desta fase. O cabecalho diz isso no proprio arquivo para nao virar
permanente por esquecimento.
