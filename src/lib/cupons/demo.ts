/**
 * Dados demonstrativos de Cupons.
 *
 * Transcritos de adm-012 (a lista) e adm-013 (o formulario). Nada foi
 * inventado: ha UM cupom no material, e ele esta aqui com os seis campos que a
 * tabela mostra.
 *
 * ========================= O CUPOM `CLOSET10` =============================
 *
 * A LISTA (adm-012) mostra, coluna por coluna:
 *
 *   CODIGO      CLOSET10
 *   DESCONTO    10%
 *   MIN.        —          <- travessao, e nao `R$ 0,00`
 *   USOS        0
 *   VALIDADE    20/08/2026
 *   STATUS      Ativo      <- pilula PRETA
 *   ACOES       Editar · Excluir
 *
 * O FORMULARIO de adm-013 mostra o mesmo cupom na lista por baixo, com o mesmo
 * `10%` — e o formulario ABERTO e o `Novo cupom`, nao a edicao dele. Os dois
 * prints sao consistentes.
 *
 * `MÍN. = —` e o que fixa a regra de `formatMinSubtotal`: o pedido minimo e
 * ZERO (o campo do formulario abre com `0`), e zero imprime travessao. Se a
 * coluna imprimisse `R$ 0,00`, o print nao mostraria `—`.
 *
 * ================= O QUE NAO ESTA EM PRINT, E POR QUE EXISTE ===============
 *
 * DOS SEIS CAMPOS DA TABELA, cinco se leem direto do print. O sexto — a DATA DE
 * CRIACAO — nao aparece em cima de lugar nenhum: a tabela de Cupons NAO tem
 * coluna de data. Mas o original monta a lista com
 * `.order("created_at", { ascending: false })`, e essa data e o que decide a
 * ordem. Com um cupom so, qualquer valor serve para a tela de hoje; ela esta
 * marcada como DERIVADA abaixo, como as datas dos carrinhos abandonados.
 *
 * =================== O QUE O MATERIAL NAO DIZ, E FICA VAZIO ================
 *
 * Os campos que a lista e o formulario mostram mas que NAO tem print para
 * preencher:
 *
 *   INICIO / VALIDADE do formulario — os dois mostram `dd/mm/aaaa` em cinza,
 *   que e o `placeholder` do `<input type="date">` VAZIO, e nao uma data
 *   digitada. So a VALIDADE da tabela tem valor: `20/08/2026`.
 *
 *   QUANTIDADE MAXIMA — em branco em todos os prints, ou seja, ILIMITADO.
 *
 *   NOME DA CAMPANHA — vazio. O print mostra so o `placeholder`
 *   `Ex: Cupom Clientes VIP`. Preencher faria a tela afirmar um nome interno
 *   que a referencia nao tem.
 *
 * Esses vazios NAO sao "faltou dado": um cupom ILIMITADO e sem nome interno e
 * exatamente o que o material mostra, e copia-lo fielmente e o objetivo.
 */

import type { Coupon } from './types';

/**
 * O UNICO CUPOM DO MATERIAL.
 *
 * `code: 'CLOSET10'` e `value: 10` sao os dois numeros que a tabela e o
 * formulario confirmam. `expiresAt` e `2026-08-20`, a data da coluna VALIDADE —
 * e ela e a unica data do cupom que o material mostra.
 *
 * O `T00:00:00` sem `Z` e o dia LOCAL (ver `fromDateInput` em `form.ts` pelo
 * motivo): e o que faz a tabela imprimir `20/08/2026` e nao `19/08/2026`.
 */
export const DEMO_COUPONS: Coupon[] = [
  {
    id: 'cup-01',
    code: 'CLOSET10',
    // Vazio: o material so mostra o placeholder do campo.
    name: '',
    kind: 'percent',
    value: 10,
    // Zero = sem pedido minimo, e a tabela imprime `—`.
    minSubtotal: 0,
    // Em branco em todos os prints = ilimitado, e a tabela imprime `0`.
    maxUses: null,
    startsAt: null,
    expiresAt: '2026-08-20T00:00:00',
    isActive: true,
    campaignId: null,
    usageLimitPerUser: 1,
    applyTo: 'all',
    applicableIds: [],
    description: '',
    // A coluna USOS mostra `0`. Escrito pelo checkout, nunca editado aqui.
    usesCount: 0,
    // DERIVADA — a tabela nao tem coluna de data. Ver o cabecalho.
    createdAt: '2026-06-01T10:00:00',
  },
];
