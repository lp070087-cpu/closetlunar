/**
 * Camada de dados de Tamanhos.
 *
 * ESTE E O UNICO PONTO DE CONTATO DA TELA COM OS DADOS. Nenhum componente
 * importa de `demo.ts` nem conhece Prisma. Quando o Neon entrar, troca-se o
 * corpo destas funcoes; a assinatura e as telas continuam iguais.
 *
 * A IMPORTACAO CRUZADA
 *
 * `listProductRules` precisa da LISTA DE PRODUTOS, e o dono dos produtos e
 * `lib/produtos`. Por isso este arquivo importa `@/lib/produtos/demo` — e a
 * mesma decisao (e o mesmo lugar) do join de `lib/categorias/data.ts`: a ponte
 * entre modulos fica na camada de dados, nunca numa tela. No Prisma ela vira um
 * `include`/`leftJoin` entre `products` e `product_size_rules`.
 *
 * TRES LEITURAS, NA ORDEM DOS TRES BLOCOS DO PRINT
 *
 *   listSizeRows      -> Tabela de Medidas        (adm-032, adm-033)
 *   listProductRules  -> Regras por Produto       (adm-034 a adm-037)
 *   listSizeLearning  -> Inteligencia de Tamanho  (adm-036, adm-037)
 */

import {
  DEMO_SIZE_LEARNING,
  DEMO_SIZE_ROWS,
  DEMO_SIZE_RULES,
  GARMENT_TYPES,
} from './demo';
import { effectiveRule, rowsForGarment } from './metrics';
import type {
  GarmentType,
  ProductSizeRule,
  SizeLearningEntry,
  SizeRow,
  ProductRuleRow,
} from './types';
import { DEMO_PRODUCTS_PRODUTOS } from '@/lib/produtos/demo';

export interface Dataset<T> {
  data: T;
  /**
   * De onde os dados vieram. A tela usa isso para rotular a origem e nao
   * apresentar dado de exemplo como se fosse real.
   */
  source: 'demo' | 'database';
}

/** Os tipos de peca que o seletor oferece, na ordem do print adm-033. */
export function listGarmentTypes(): { value: GarmentType; label: string }[] {
  return GARMENT_TYPES;
}

/**
 * Leitura da matriz de um tipo de peca.
 *
 * Assincrona de proposito, igual aos outros modulos: e o que a chamada ao Neon
 * vai ser, e assim nenhuma tela precisa mudar de sincrona para assincrona
 * depois. `signal` ja esta no contrato para cancelamento.
 *
 * Tipo sem linha devolve lista VAZIA, e nao uma lista de zeros: sao coisas
 * diferentes — "nao ha medida cadastrada" e "as medidas sao zero" — e a tela
 * precisa poder dizer a primeira.
 */
export async function listSizeRows(
  garmentType: GarmentType,
  options?: { signal?: AbortSignal },
): Promise<Dataset<SizeRow[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  const rows = rowsForGarment(DEMO_SIZE_ROWS, garmentType);
  return { data: rows, source: 'demo' };
}

/**
 * Leitura das regras por produto.
 *
 * A LISTA DE PRODUTOS vem inteira da Fase 2 — ela e a dona dos produtos — mas a
 * ORDEM e ordem do print adm-034, e nao a de `lib/produtos`. Essa distincao
 * importa: `lib/produtos/demo.ts` comeca por `top`, enquanto o print lista
 * `Conjunto Glow Nude` em primeiro e `Top Essential Sustentação` em ultimo, ou
 * seja, alfabetica. Reusar a ordem de Produtos aqui mostraria as dez linhas na
 * ordem errada sem ninguem perceber.
 *
 * Cada produto sai com a regra EFETIVA: a salva, ou o padrao do print. Assim a
 * tela nunca precisa decidir "e quando nao tem regra?", porque a resposta e a
 * mesma em todo lugar.
 *
 * Hoje nao ha regra salva nenhuma: `DEMO_SIZE_RULES` e vazio, e todos os
 * produtos saem no padrao. E exatamente o que os prints mostram — todas as
 * linhas com `Modelagem normal` e `Média elasticidade`, e a observacao vazia.
 */
export async function listProductRules(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<ProductRuleRow[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');

  const data = [...DEMO_PRODUCTS_PRODUTOS]
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((product) => ({
      productId: product.id,
      productName: product.name,
      rule: effectiveRule(product.id, DEMO_SIZE_RULES.get(product.id)),
    }));

  return { data, source: 'demo' };
}

/**
 * Leitura do log de Inteligencia de Tamanho.
 *
 * Hoje devolve lista vazia, fiel ao print adm-036. Nao ha o que ordenar nem o
 * que resumir enquanto nao existir uma linha.
 */
export async function listSizeLearning(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<SizeLearningEntry[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: [...DEMO_SIZE_LEARNING], source: 'demo' };
}

/**
 * Escrita.
 *
 * NAO PERSISTE NADA. Enquanto o Neon nao existir, estas funcoes devolvem o que
 * foi enviado para que a tela possa atualizar o campo; mas `persisted: false`
 * marca explicitamente que o dado NAO foi gravado.
 *
 * Isso e intencional, e aqui pesa mais que nos outros modulos: a Tabela de
 * Medidas SALVA SOZINHA ao sair do campo. Um salvamento automatico que
 * fingisse gravar seria a pior versao possivel deste modulo, porque a pessoa
 * nem clicaria em nada para desconfiar — ela preencheria 50 campos, sairia da
 * tela e perderia tudo achando que estava salvo.
 */
export interface WriteResult<T> {
  data: T;
  persisted: boolean;
  reason?: string;
}

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/** Grava uma medida. E o "salva ao sair do campo" do rodape do print. */
export async function saveMeasurement(row: SizeRow): Promise<WriteResult<SizeRow>> {
  return { data: row, persisted: false, reason: PENDING_REASON };
}

/** Grava a regra de um produto — o botao `SALVAR` de cada linha. */
export async function saveProductRule(rule: ProductSizeRule): Promise<
  WriteResult<ProductSizeRule>
> {
  return { data: rule, persisted: false, reason: PENDING_REASON };
}

export { PENDING_REASON };
