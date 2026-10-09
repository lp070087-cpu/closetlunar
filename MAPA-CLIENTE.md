# MAPA-CLIENTE — Painel do Cliente (Fase 2)

Fonte da verdade desta fase. Cada linha liga **um arquivo de print** a **uma
tela/estado** e ao **trecho do projeto original Lovable** que o comprova.

## Fontes e prioridade

```
PRINT DO PAINEL DO CLIENTE  >  PROJETO LOVABLE ORIGINAL  >  ESTRUTURA ATUAL  >  INFERENCIA
```

- Prints: `..\Painel do cliente\` (20 PNG, contados em disco).
- Original: `..\PROJETO-ORIGINAL-LOVABLE-REFERENCIA\src\routes\conta*.tsx` +
  `src\components\site\account\*` + `src\lib\customerAuth.tsx`.
- Todas as pastas de referencia sao **read-only**. Nada foi escrito nelas.

## Nomenclatura da area

O original monta a area da cliente por **file-based routing do TanStack**, com
prefixo de arquivo, e a URL publica sai do nome do arquivo:

| arquivo do original          | URL          |
| ---------------------------- | ------------ |
| `routes/conta.tsx` (layout)  | `/conta`     |
| `routes/conta.index.tsx`     | `/conta`     |
| `routes/conta.pedidos.tsx`   | `/conta/pedidos` |
| `routes/conta.favoritos.tsx` | `/conta/favoritos` |
| `routes/conta.enderecos.tsx` | `/conta/enderecos` |
| `routes/conta.medidas.tsx`   | `/conta/medidas` |
| `routes/conta.pontos.tsx`    | `/conta/pontos` |
| `routes/conta.cupons.tsx`    | `/conta/cupons` |
| `routes/conta.dados.tsx`     | `/conta/dados` |
| `routes/conta.seguranca.tsx` | `/conta/seguranca` |
| `routes/conta.afiliada.tsx`  | `/conta/afiliada` |
| `routes/conta.looks.tsx`     | `/conta/looks` |

A barra de status do print `004709` imprime literalmente
`https://closetlunar.lovable.app/conta`. **A rota base e `/conta`.** Nao existe
`/cliente` em fonte nenhuma — `/cliente` nao e usado.

## Os 20 prints

Todos foram abertos e lidos. Numeracao `cli-NNN` segue a ordem do nome do
arquivo (que e a ordem de captura).

| PRINT   | ARQUIVO (sufixo) | TELA / ESTADO                                    | ROTA               | REFERENCIA ORIGINAL                    | OBSERVACAO |
| ------- | ---------------- | ------------------------------------------------ | ------------------ | -------------------------------------- | ---------- |
| cli-001 | `004603`         | Dashboard (topo) + toast `Bem-vinda de volta!`    | `/conta`           | `conta.index.tsx` + toast do login     | estado logo apos entrar |
| cli-002 | `004612`         | Dashboard (mesmo estado, toast ja sumiu)          | `/conta`           | `conta.index.tsx`                      | **duplicata** de cli-001 |
| cli-003 | `004641`         | Dashboard (rolado) — ultimo pedido + cupons + rodape | `/conta`        | `conta.index.tsx`                      | **continuacao rolada** de cli-002 |
| cli-004 | `004649`         | Meus Pedidos — lista preenchida (4 itens + 1 cortado) | `/conta/pedidos` | `conta.pedidos.tsx`                  | 4 status `AGUARDANDO PAGAMENTO` |
| cli-005 | `004701`         | Meus Pedidos (rolado) — itens 2 a 5 + rodape      | `/conta/pedidos`   | `conta.pedidos.tsx`                    | **continuacao** de cli-004 |
| cli-006 | `004709`         | Favoritos — **estado vazio** + barra de URL       | `/conta/favoritos` | `conta.favoritos.tsx`                  | prova a rota `/conta` |
| cli-007 | `004717`         | Favoritos (rolado) — card vazio + rodape          | `/conta/favoritos` | `conta.favoritos.tsx`                  | **continuacao** de cli-006 |
| cli-008 | `004726`         | Enderecos — **estado vazio** + `+ NOVO ENDERECO`  | `/conta/enderecos` | `conta.enderecos.tsx`                  | |
| cli-009 | `004737`         | Enderecos (rolado) — card vazio + rodape          | `/conta/enderecos` | `conta.enderecos.tsx`                  | **continuacao** de cli-008 |
| cli-010 | `004742`         | Minhas Medidas (topo) — 6 campos + cartao de recomendacao | `/conta/medidas` | `conta.medidas.tsx`          | |
| cli-011 | `004753`         | Minhas Medidas (rolado) — sim/nao + salvar + `Historico de Medidas` | `/conta/medidas` | `conta.medidas.tsx` | **continuacao** de cli-010 |
| cli-012 | `004801`         | Clube VIP & Cashback (topo) — cartao BRONZE + progresso | `/conta/pontos` | `conta.pontos.tsx`                | |
| cli-013 | `004819`         | Clube VIP (rolado) — recompensas + niveis + regras | `/conta/pontos`   | `conta.pontos.tsx`                     | **continuacao** de cli-012 |
| cli-014 | `004830`         | Clube VIP (fim) — 3a recompensa + regras + rodape | `/conta/pontos`    | `conta.pontos.tsx`                     | **continuacao** de cli-013 |
| cli-015 | `004841`         | Cupons — cupom `CLOSET10` **expirado**            | `/conta/cupons`    | `conta.cupons.tsx`                     | EXPIRA 20/08/2026 |
| cli-016 | `004850`         | Cupons (rolado) — mesmo card + rodape             | `/conta/cupons`    | `conta.cupons.tsx`                     | **continuacao** de cli-015 |
| cli-017 | `004857`         | Dados da Conta — formulario + cartoes laterais    | `/conta/dados`     | `conta.dados.tsx`                      | |
| cli-018 | `004905`         | Dados da Conta (rolado)                           | `/conta/dados`     | `conta.dados.tsx`                      | **continuacao** de cli-017 |
| cli-019 | `004914`         | Seguranca — alterar senha + sessoes + logout      | `/conta/seguranca` | `conta.seguranca.tsx`                  | barra de URL diz `/conta/pedidos` (link anterior) |
| cli-020 | `004922`         | Seguranca (rolado)                                | `/conta/seguranca` | `conta.seguranca.tsx`                  | **continuacao** de cli-019 |

**20 prints = 10 telas.** Os outros 10 sao continuacoes roladas (mesma rota,
mesmo estado) ou duplicata de estado.

## As 10 telas

| # | TELA | PRINT(S) | ARQUIVO LOVABLE | ESTADOS COMPROVADOS |
| - | ---- | -------- | --------------- | ------------------- |
| 1 | Dashboard | cli-001, 002, 003 | `conta.index.tsx` | preenchido (3 KPI + nivel VIP + ultimo pedido + cupom ativo) |
| 2 | Meus Pedidos | cli-004, 005 | `conta.pedidos.tsx` | preenchido (5 pedidos, status `novo`); vazio existe no original |
| 3 | Favoritos | cli-006, 007 | `conta.favoritos.tsx` | **vazio** (`Sua lista de favoritos esta vazia.`) |
| 4 | Enderecos | cli-008, 009 | `conta.enderecos.tsx` | **vazio** (`Voce ainda nao possui enderecos cadastrados.`) + botao `+ NOVO ENDERECO` |
| 5 | Minhas Medidas | cli-010, 011 | `conta.medidas.tsx` | preenchido (altura/peso/idade) + recomendacao `Aguardando dados` + historico vazio |
| 6 | Clube VIP & Cashback | cli-012, 013, 014 | `conta.pontos.tsx` | preenchido (BRONZE, saldo 0, 3 recompensas bloqueadas, historico vazio) |
| 7 | Cupons | cli-015, 016 | `conta.cupons.tsx` | preenchido mas **expirado** (`CLOSET10`, `EXPIRADO`) |
| 8 | Dados da Conta | cli-017, 018 | `conta.dados.tsx` | preenchido (e-mail real, telefone vazio) |
| 9 | Seguranca | cli-019, 020 | `conta.seguranca.tsx` | preenchido (ultimo login, sessoes) |
| 10 | Login / Criar conta | — **sem print** | `CustomerLogin.tsx` + `AccountLayout.tsx` | comprovado apenas no original |

## Telas do original SEM print

| TELA | ARQUIVO LOVABLE | POR QUE IMPLEMENTAR |
| ---- | --------------- | ------------------- |
| Login / Criar conta / Esqueci a senha | `components/site/account/CustomerLogin.tsx` | e o portao da area: sem ele, nenhuma das 9 telas e alcancavel. O original comprova os campos, o olho da senha, `Manter conectado` e as duas mensagens. |
| Afiliada | `conta.afiliada.tsx` | **item de navegacao comprovado no print** (`cli-001`, item `Afiliada`). O print prova o ITEM; o original prova a TELA. |
| Estado CONFIRMADO dos pedidos (pago/enviado/entregue/cancelado) | `conta.pedidos.tsx` (`STATUS_LABEL`) | o original e a unica fonte onde os seis estados aparecem juntos; a bancada exige que os seis existam. |

## Telas do original que NAO entram nesta fase

| TELA | ARQUIVO LOVABLE | MOTIVO |
| ---- | --------------- | ------ |
| Looks salvos | `conta.looks.tsx` | **sem item de navegacao** nos prints e **sem print proprio**. O print prova 9 itens + `Sair da conta`; `Looks` nao e nenhum deles. Fica registrado como referencia insuficiente. |

## Navegacao do print (cli-001 / cli-019)

Ordem exata da sidebar, com o icone do original:

```
Dashboard                 LayoutDashboard
Meus Pedidos              Package
Meus Favoritos            Heart
Enderecos                 MapPin
Minhas Medidas            Ruler
Clube VIP & Cashback      Trophy
Cupons                    Ticket
Dados da Conta            UserCog
Seguranca                 Shield
------------------------- divisor
Sair da conta             LogOut   (rosa, acao — nao e rota)
```

Item ativo = **pilula preta arredondada** (`bg-foreground text-background`).
Mobile = a mesma lista vira **linha horizontal de pilulas rolavel** e o
`Sair da conta` vira um botao de largura total acima do conteudo
(`AccountLayout.tsx`, `lg:hidden`).

## Cabecalho (cli-001)

```
MINHA CONTA                                   (caixa alta, tracking largo, 11px)
Ola, lp070087@gmail.com                       (serif, grande)
```

O original usa `full_name?.split(' ')[0]` — e-mail quando nao ha nome. Os prints
mostram o e-mail porque essa conta nao tem nome salvo. **Nao inventar um nome.**

## Rodape (cli-003, 005, 007, ...)

O pai `__root.tsx` injeta o rodape da loja em toda rota. `conta.*.tsx` **nao** o
importa. O bloco visivel no fim de toda tela e:

```
instagram  ·  SIGA-NOS NO INSTAGRAM  ·  @closetlunar     (fundo preto)
```

## Eixo horizontal (medido)

Medido na captura de `cli-019`, que e a que mostra a coluna e o painel juntos.
A soma FECHA na largura da imagem:

| trecho | x | largura |
| ------ | - | ------- |
| recuo lateral esquerdo | 0..12 | 12 |
| coluna de navegacao | 12..272 | **260** |
| vao coluna/painel | 272..312 | **40** |
| painel de conteudo | 312..2524 | 2212 |
| recuo lateral direito | 2524..2536 | 12 |

**Total: 2536 px — a largura exata da captura.**

As quatro bordas foram encontradas pela cor `--border` (233,227,223), amostrada
em x = 10, 269, 310 e 2522. Duas consequencias:

1. **Nao ha teto de largura.** A coluna comeca no primeiro pixel do recuo, e o
   original declara `container mx-auto px-3 sm:px-4 … max-w-full`. Um `max-w-*`
   proprio deslocaria a coluna para dentro assim que a janela passasse do teto,
   e o print nao mostra deslocamento nenhum.
2. **A captura esta em 2x.** As 2536 colunas de pixel sao ~1268 px de CSS — a
   largura tipica de um notebook. E o que confirma que a coluna de 260 px de
   pixel e a coluna de 260 px de CSS, e que as alturas de maiuscula lidas nos
   prints sao as METADES das classes do original.

O cabecalho da loja **nao** esta preso a esse recuo: medido em `cli-001`, o
conteudo dele vai de x 517 a 2011, centrado em 1264 — e o centro da imagem e
1265. Ele e `container mx-auto px-4` como no original, com a sobra distribuida
para os dois lados.

Um numero antigo nesta secao dizia "x = 483 → 3231, numa captura de 3840 px".
Nenhuma captura deste projeto tem 3840 px de largura — as 20 do cliente vao de
2531 a 2543 — e a medicao nao se reproduz. Foi substituida pela tabela acima.

## Fora de escopo (nao inventar)

Autenticacao real, backend, banco, cartao, notificacoes, avaliacoes, suporte,
chat flutuante do WhatsApp, `Looks`, pagina de produto, carrinho. Nada disso tem
print **nem** rota no material do cliente.
