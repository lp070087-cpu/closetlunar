/**
 * Dados demonstrativos de Afiliadas.
 *
 * Transcritos de adm-021 (a lista) e adm-022 (o formulario aberto). Nada foi
 * inventado: ha UMA afiliada no material, e ela esta aqui com os cinco campos
 * que a tabela mostra.
 *
 * ============================ A AFILIADA `Carinna` =========================
 *
 * A LISTA (adm-021) mostra, coluna por coluna:
 *
 *   NOME / E-MAIL    Carinna
 *                    lucasmuniz19w@gmail.com
 *   CUPOM / LINK     CARINNAS          <- mono, negrito
 *                    /                 <- link, em cinza pequeno
 *   COMISSAO         5%                <- percentual
 *   STATUS           ACTIVE            <- pilula VERDE, texto CRU
 *   ACOES            Editar · Suspender
 *
 * O link da segunda linha e `/` SOZINHO. Ver `formatReferral` em `metrics.ts`:
 * e o que acontece quando o `referral_slug` esta vazio, e NAO um slug que se
 * chama `/`.
 *
 * O FORMULARIO de adm-022 esta ABERTO no modo NOVO (o titulo diz `Nova
 * Afiliada`), com os campos vazios mostrando apenas `placeholder` — `Nome`,
 * `E-mail`, `Cupom (ex: LUNA10)`, `Slug (ex: luna10)`, o seletor em
 * `Percentual (%)` e o valor `10`. Dois dos tres numeros do formulario
 * (`Percentual (%)` e `10`) sao padroes do original; o `Nome`, o `E-mail`, o
 * `Cupom` e o `Slug` sao o `placeholder` de campo VAZIO. Ver `emptyDraft` em
 * `form.ts`.
 *
 * `ACTIVE` EM CAIXA ALTA e o texto CRU da coluna. O original imprime
 * `{af.status}` direto — nao ha traducao — e o print confirma: aparece `ACTIVE`,
 * e nao `Ativa`. Ver `affiliateStatusLabel`.
 *
 * ================== OS CINCO CAMPOS QUE NAO ESTAO EM PRINT =================
 *
 * A COLUNA de status mostra `ACTIVE` (dois valores possiveis, `active` e
 * `suspended`, o segundo so aparecendo depois de clicar em `Suspender`). Mas o
 * `bank_info`, o `user_id`, o `created_at` e o `updated_at` existem na tabela e
 * NENHUM print os mostra — nenhum formulario os edita, e nenhuma coluna os
 * exibe. Eles ficam com valores DERIVADOS aqui, marcados abaixo, e o motivo e
 * um so: o `upsert` do original grava o OBJETO INTEIRO. Uma coluna ausente do
 * objeto seria sobrescrita com nulo no primeiro salvamento.
 *
 *   `bankInfo`  — `null`. Nenhum print mostra dado bancario, e o formulario
 *                 nao tem campo. Preservado, nunca editado. Ver `types.ts`.
 *   `userId`    — `null`. Nulo enquanto a afiliada nao tiver conta ligada. O
 *                 print nao mostra se a Carinna tem conta, e o original nasce
 *                 com nulo na insercao.
 *   `createdAt` — DERIVADA. A lista nao tem coluna de data, mas o original
 *                 ordena com `.order("created_at", { ascending: false })`, e
 *                 essa data e o que decide a ordem. Com uma afiliada so,
 *                 qualquer valor serve para a tela de hoje.
 *   `updatedAt` — DERIVADA, igual ao `createdAt` na criacao.
 */

import type { Affiliate } from './types';

/**
 * A UNICA AFILIADA DO MATERIAL.
 *
 * `name: 'Carinna'`, `email: 'lucasmuniz19w@gmail.com'`, `couponCode:
 * 'CARINNAS'` e `commissionValue: 5` sao os quatro valores que a tabela
 * confirma, literalmente.
 *
 * `referralSlug` e `''` — VAZIO — porque e isso que produz o link `/` da
 * segunda linha da coluna CUPOM / LINK. Ver `formatReferral`.
 *
 * `commissionType: 'percentage'` porque a COMISSAO imprime `5%`, e o `%` so
 * aparece no ramo percentual de `formatCommission`.
 */
export const DEMO_AFFILIATES: Affiliate[] = [
  {
    id: 'aff-01',
    name: 'Carinna',
    email: 'lucasmuniz19w@gmail.com',
    couponCode: 'CARINNAS',
    // Vazio de proposito: o link da tabela sai como `/`. Ver o cabecalho.
    referralSlug: '',
    commissionType: 'percentage',
    commissionValue: 5,
    status: 'active',
    // Nao exibido nem editado. Preservado no salvamento. Ver o cabecalho.
    bankInfo: null,
    userId: null,
    // DERIVADA — a tabela nao tem coluna de data. Ver o cabecalho.
    createdAt: '2026-06-01T10:00:00',
    updatedAt: '2026-06-01T10:00:00',
  },
];
