/**
 * Tipos do dominio de Cupons.
 *
 * ESTE E O CONTRATO QUE A TELA CONSOME HOJE e que o Prisma vai satisfazer
 * depois, com os nomes em camelCase traduzidos para as colunas snake_case na
 * camada de dados, num unico lugar.
 *
 * OS NOMES SAO OS DO ORIGINAL, e nao uma traducao livre. O `CouponsAdmin` monta
 * o formulario e a tabela a partir destes campos, e cada rotulo do print aponta
 * para um deles:
 *
 *   CODIGO ......................... `code`
 *   NOME DA CAMPANHA (INTERNO) ..... `name`
 *   TIPO ........................... `kind`
 *   PERCENTUAL (%) / VALOR (R$) .... `value`
 *   SUBTOTAL MINIMO (R$) ........... `minSubtotal`
 *   QUANTIDADE MAXIMA .............. `maxUses`
 *   INICIO (OPCIONAL) .............. `startsAt`
 *   VALIDADE (OPCIONAL) ............ `expiresAt`
 *   USO POR CLIENTE ................ `usageLimitPerUser`
 *   APLICAR EM ..................... `applyTo` + `applicableIds`
 *   STATUS ......................... `isActive`
 *
 * OS DOIS CAMPOS QUE O PRINT MOSTRA E QUE O PRINT NAO EXPLICA:
 *
 *   `applyTo` / `applicableIds` — o seletor `Aplicar em` de adm-013 oferece
 *   tres opcoes (`Todo o site`, `Produtos especificos`, `Categorias
 *   especificas`), mas NENHUM print mostra a lista de selecao que as duas
 *   ultimas abrem. O campo existe porque o seletor existe; a lista de alvos
 *   fica vazia e NAO ha tela para escolher, porque inventar um seletor de
 *   produtos que a referencia nao mostra seria inventar interface. Ver
 *   `data.ts` e o aviso registrado na tela.
 *
 *   `description` — o original guarda `description` no cupom e o formulario
 *   NAO tem campo para ela (`EMPTY_COUPON` a inicia vazia e nenhum `Field` a
 *   edita). Ela fica no tipo porque a coluna existe no banco do original e
 *   descartá-la faria o SELECT do Neon perder um dado; mas ela nao aparece no
 *   formulario nem na tabela, porque print nenhum a mostra.
 */

/** Como o desconto e calculado. O `Tipo` do print tem exatamente estas duas. */
export type CouponKind = 'percent' | 'fixed';

/**
 * Onde o cupom vale. Os tres rotulos sao os do seletor `Aplicar em`.
 *
 * `all` e o padrao e o unico que o print de cupom exercita: o cupom `CLOSET10`
 * da lista nao mostra escopo nenhum na tabela — a tabela nao tem coluna para
 * isso. Os outros dois existem no contrato porque o seletor os oferece.
 */
export type CouponApplyTo = 'all' | 'products' | 'categories';

export interface Coupon {
  id: string;
  /** Texto do cupom. SEMPRE maiusculo — o original faz `.toUpperCase()` ao salvar. */
  code: string;
  /** Nome interno da campanha. Nao aparece na loja. Pode ficar vazio. */
  name: string;
  kind: CouponKind;
  /**
   * O desconto. E `10` no print, com `kind: 'percent'` — ou seja, 10%.
   *
   * NAO e 0.10: o original guarda o numero COMO DIGITADO (`Number(r.value)`) e
   * formata `10%` na tabela com `${Number(r.value)}%`. Guardar fracao faria a
   * tabela precisar de multiplicacao por 100 e o banco guardaria um valor que
   * ninguem digitou.
   */
  value: number;
  /** Pedido minimo para o cupom valer. `0` = sem minimo, e a tabela mostra `—`. */
  minSubtotal: number;
  /**
   * Teto de usos. `null` = ILIMITADO, e o rotulo do campo diz isso
   * (`Quantidade maxima (em branco = ilimitado)`). Nao confundir com `0`.
   */
  maxUses: number | null;
  /** ISO. `null` = comeca agora. */
  startsAt: string | null;
  /** ISO. `null` = sem validade. */
  expiresAt: string | null;
  isActive: boolean;
  /** Campanha dona do cupom, quando existir. Sem uso nesta tela. */
  campaignId: string | null;
  /** Quantas vezes o MESMO cliente pode usar. `1` e o padrao do original. */
  usageLimitPerUser: number;
  applyTo: CouponApplyTo;
  /** Ids de produtos ou categorias, quando `applyTo` nao for `all`. */
  applicableIds: string[];
  /** Nao editavel nesta tela — ver o comentario do cabecalho. */
  description: string;
  /** Ja usado. NAO e editavel: quem escreve e o checkout, ao aplicar o cupom. */
  usesCount: number;
  createdAt: string;
}

/**
 * Rascunho do formulario.
 *
 * OS DOIS NUMEROS QUE VIRAM STRING aqui merecem explicacao, porque no original
 * nao sao string:
 *
 *   `value` — o botao nativo `<input type="number">` do original guarda
 *   `Number(e.target.value)`, e `Number('')` e 0. Isso cria um defeito visivel:
 *   apagar o campo `Percentual (%)` faz o input mostrar `0` e nao vazio, porque
 *   o React reescreve o valor. Com o rascunho em string, o campo aceita o
 *   estado "ainda nao digitou" — que e o que qualquer pessoa espera ao apagar
 *   para redigitar. A conversao acontece uma vez, em `draftToCoupon`.
 *
 *   `minSubtotal` — pelo mesmo motivo, e porque o print abre o campo com `0`
 *   (um valor, nao um vazio).
 *
 * `maxUses` continua string PORQUE vazio significa ILIMITADO e nao zero; o
 * rotulo do campo diz exatamente isso.
 */
export interface CouponDraft {
  code: string;
  name: string;
  kind: CouponKind;
  /** String enquanto se digita. `''` = campo vazio. */
  value: string;
  minSubtotal: string;
  /** String. `''` = ilimitado. */
  maxUses: string;
  /** `aaaa-mm-dd`, o formato do `<input type="date">`. */
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  usageLimitPerUser: string;
  applyTo: CouponApplyTo;
  applicableIds: string[];
  description: string;
  campaignId: string | null;
}

/** Erros por campo, no formato que o `Field` do design system ja usa. */
export type CouponFieldErrors = Partial<Record<keyof CouponDraft, string>>;

/**
 * Uma linha da lista de cupons mais usados.
 *
 * MORA AQUI, e nao em Campanhas, de proposito: e uma projecao dos CUPONS,
 * ordenada por uso — a tela de Campanhas so a exibe. O dono do dado e este
 * modulo, e `campanhas/data.ts` importa daqui. Ver o comentario em
 * `lib/campanhas/*` quando aquele modulo entrar.
 */
export interface CouponUsage {
  code: string;
  usesCount: number;
}
