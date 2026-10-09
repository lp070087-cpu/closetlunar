# BACKEND-STATUS — Fases 4 e 5

Arquivo de retomada. Mantido **compacto**.

## Cabecalho

- Projeto: `closet-lunnar`
- Fases: **4** (arquitetura do backend) e **5** (banco real + integracao + auth)
- **STATUS: PREPARADO E PROVADO — NEON BLOQUEADO POR `DATABASE_URL`**
- Typecheck global: **EXIT=0**
- Bancadas: `bench-fase5` **51/51** · `bench-backend` **66/66** · `bench-site-auditoria` **24/24** · `bench-cliente-auditoria` **38/38** · `bench-cupons` **65/65**

## O diagnostico do Prisma — medido, nao suposto

| comando | resultado | causa |
| ------- | --------- | ----- |
| `prisma format` | **FAIL** (timeout) | precisa do engine linux |
| `prisma validate` | **FAIL** | precisa do engine linux |
| `prisma generate` | **FAIL** | precisa do engine linux |
| `prisma generate --no-engine` | **FAIL** | ainda precisa do schema-engine |
| migration | **BLOQUEADA** | sem `DATABASE_URL` |
| conexao com o banco | **BLOQUEADA** | sem `DATABASE_URL` |

**A causa e uma so, e e ambiental:** o `node_modules/@prisma/engines` tem
**apenas** os binarios do **Windows** (`schema-engine-windows.exe`), e o do linux
precisa baixar — `binaries.prisma.sh` responde **403**. Nao e versao errada
(`6.19.3` instalado, `^6.3.1` declarado) nem schema invalido.

**Por isso o `PrismaClient` e `any`:** o stub em `node_modules/.prisma/client` e o
que o pacote publica quando `generate` nunca rodou. Nada importa os models, entao
o `any` nao alcanca o `tsc` — o projeto compila em `strict: true` (EXIT=0).

## O que esta entregue

| # | Entrega | Estado |
| - | ------- | ------ |
| 1 | `prisma/schema.prisma` — 33 models, 17 enums | **PRONTO** (validacao por engine BLOQUEADA) |
| 2 | `prisma/seed.mjs` | **PRONTO** — testado: recusa sem banco, nao inventa |
| 3 | `src/lib/data/repositorio.ts` — o seam demo/real | **PRONTO e PROVADO** |
| 4 | `src/lib/data/mapear.ts` — banco -> dominio | **PRONTO e PROVADO** |
| 5 | `src/lib/auth/senha.ts` — `scrypt` | **PRONTO e PROVADO** (Fase 4) |
| 6 | `src/lib/auth/sessao.ts` — token assinado | **PRONTO e PROVADO** (Fase 4) |
| 7 | `src/lib/auth/decisao.ts` — a decisao pura | **PRONTO e PROVADO** |
| 8 | `src/lib/auth/guardas.ts` — guarda server-side | **PRONTO e PROVADO** |
| 9 | `src/lib/auth/acoes.ts` — entrar/cadastrar/sair | **PRONTO**; login real BLOQUEADO |
| 10 | `src/lib/pagamento/provider.ts` — abstracao | **PRONTO e PROVADO** |
| 11 | **Ligar os `data.ts` ao repositorio** | **BLOQUEADO** |
| 12 | **migrations reais** | **BLOQUEADO** |

## Fluxo de um dominio, quando a credencial entrar

Cada `data.ts` ja tem a forma final. Trocar o corpo e uma linha:

```ts
// hoje
return { data: DEMO_X, source: 'demo', reason: PENDING_REASON };

// quando houver banco
return ler(DEMO_X, async (db) => {
  const linhas = await db.<model>.findMany();
  return linhas.map(paraX);
});
```

`ler` faz a checagem, a chamada e o piso de demonstracao — e nao muda de dominio
para dominio. **O `data.ts` nao importa `db` nem Prisma:** ele so descreve a
consulta.

## Provas da Fase 5 (o que a bancada afirma)

- **A autenticacao decide certo:** senha errada, usuario inexistente e conta
  inativa recusam; cliente nao entra no admin; admin entra; a mensagem e
  **identica** para senha errada e e-mail inexistente (nao vaza quais e-mails
  existem); a conferencia roda **mesmo sem usuario** (o tempo nao revela).
- **O repositorio nao mente:** sem banco devolve `demo` COM motivo; `database`
  so aparece **depois** da consulta, no codigo; uma leitura que falha cai para
  `demo` e diz isso; a mensagem de erro e **cortada** (o Prisma poe a query na
  mensagem).
- **O mapeamento:** `Decimal` -> `number`; `Date` -> ISO; **`null` continua
  `null`**; status desconhecido cai para o lado que **nao publica**; estado de
  pagamento desconhecido cai em `pendente` (**nunca em `pago`**).
- **A guarda e server-side:** usa `cookies()`/`redirect()`; o filtro de dono sai
  da SESSAO; a sessao de demonstracao tem id sentinela.
- **Provas ao contrario:** nenhum `any`, nenhum `@ts-ignore`, nenhuma coluna de
  senha sem `hash`, nenhum SDK de gateway, nenhum gateway implementado fora do
  admin.

## Estado real das integracoes

| dominio | estado |
| ------- | ------ |
| NEON | **BLOQUEADO POR `DATABASE_URL`** — so `.env.example`, com host de exemplo |
| PRISMA | schema pronto; **format/validate/generate FAIL** (engine linux 403) |
| MIGRATIONS | **BLOQUEADA** |
| AUTH | **codigo completo e provado**; o login REAL e bloqueado (precisa ler `User`) |
| PAGAMENTO | **PREPARADO — GATEWAY A DEFINIR PELO PROPRIETARIO** |
| FRETE | **INTEGRACAO A DEFINIR** (o `.env.example` sugere Melhor Envio) |
| STORAGE | **PROVIDER A DEFINIR** — o seed nao grava imagem |
| E-MAIL | **AGUARDA PROVIDER** (o historico persiste; o envio nao) |
| WHATSAPP | link `wa.me` **funciona**; API **AGUARDA PROVIDER** |

## A mencao de gateway que fica registrada

`src/components/admin/configuracoes/payments-tab.tsx` (**Fase 1**) tem uma secao
`InfinitePay` e uma `WEBHOOK_URL` com `/api/public/infinitepay/webhook`. Presume
um gateway que ainda nao foi escolhido. **Nao foi corrigido**: transcreve o print
`adm-083` (cujo titulo E `Pagamentos — InfinitePay`) e a Fase 1 esta aprovada.
**E o primeiro lugar onde a decisao do gateway encosta.**

## O que o build diz

`npm run build` -> **FAIL ambiental**, e nao de codigo:

```
Attempted to load @next/swc-linux-x64-gnu, but it was not installed
fetch failed: getaddrinfo EAI_AGAIN registry.npmjs.org
Failed to load SWC binary for linux/x64
```

O projeto foi instalado no **Windows** e o binario do SWC para linux nao esta no
`node_modules`; baixar exigiria rede, que o sandbox nao tem.

## Para destravar (basta UMA credencial)

1. `DATABASE_URL` + `DIRECT_URL` no `.env`;
2. `npx prisma generate` — gera o cliente com os 33 models;
3. `npx prisma migrate dev` — banco **novo**: `db push`/`migrate dev`;
   banco **com dados**: revisar a migration antes (nada destrutivo automatico);
4. `node prisma/seed.mjs`;
5. tirar o `null` do `db()` e ligar cada `data.ts` pelo `ler`;
6. **apagar as duas contas de teste do seed, ou trocar a senha.**

## Pendencias de validacao (registradas, nao maquiadas)

- **REVISAO VISUAL MANUAL PENDENTE.** Nao ha navegador no ambiente
  (`which chromium/chrome/firefox` — nenhum) e o `next dev` nao serve. A Home
  **nunca foi vista renderizada**, desde a Fase 3.
- Validacao por engine do schema, migration e conexao — tudo na **credencial**.
