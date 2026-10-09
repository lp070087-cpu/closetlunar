'use client';

import { useId, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * TRES padroes de aba aparecem nos prints — e o terceiro chegou depois.
 *
 * 1. `SegmentedTabs` — pilula escura unica com a opcao ativa em destaque.
 *    Usada em "Todos / Rastreamento" (Pedidos), "Clientes / Leads / Segmentos"
 *    (CRM) e nas tres abas de Fidelidade.
 * 2. `UnderlineTabs` — texto com sublinhado na aba ativa.
 *    Usada nas abas internas de Configuracoes.
 * 3. `PillTabs` — CADA aba e uma pilula propria, com borda clara; a ativa fica
 *    preta e sem borda. Sete abas em `Conteudo do Site` (adm-053 a adm-059).
 *
 * ================== CORRECAO REGISTRADA NA FASE 7 ==================
 *
 * Este comentario dizia que "Clientes / Leads / Segmentos" era `UnderlineTabs`. Esta
 * ERRADO. O print adm-005 mostra `Clientes` dentro de uma pilula PRETA arredondada,
 * com `Leads` e `Segmentos` em texto solto ao lado — e sem sublinhado em lugar
 * nenhum. E o visual do `SegmentedTabs`, e e ele que o CRM usa. O comentario estava
 * deduzindo o componente a partir do formato da lista de abas, e nao do print.
 *
 * ================== A SEGUNDA CORRECAO, ERRADA PELO MESMO MOTIVO ==================
 *
 * O paragrafo acima dizia ainda, ate a fase do grupo Conteudo, que `UnderlineTabs`
 * era "usada nas abas internas de Conteudo do Site E de Configuracoes".
 *
 * A METADE DE CONTEUDO DO SITE ESTAVA ERRADA — e errada pelo MESMO defeito que a
 * correcao acima descreve, o que e a parte interessante. Eu tinha corrigido o
 * primeiro caso deduzindo do formato da LISTA e deixei o segundo intacto, deduzindo
 * de novo: sete abas em fila parecem sublinhado.
 *
 * O print `235737.png` (adm-053) mostra as sete — `Hero Banner`, `Categorias`,
 * `Seções da Home`, `Banners Promocionais`, `Benefícios`, `Instagram`, `Rodapé` —
 * como SETE PILULAS INDIVIDUAIS com borda clara, e a ativa PREENCHIDA DE PRETO e sem
 * borda. Nao ha sublinhado em nenhuma delas, e nao ha trilho unico em volta (as
 * pilulas tem borda propria e um vao entre elas), entao nao e nenhum dos dois
 * componentes que ja existiam.
 *
 * OU SEJA: a deducao errou DUAS vezes em dois lugares, porque o metodo estava
 * errado — nao se escolhe o componente pelo desenho da faixa, se escolhe pelo print.
 * O segundo caso so apareceu quando os prints de adm-053 em diante foram abertos,
 * uma fase inteira depois. O registro fica pelos dois: a correcao de um caso nao
 * absolve o outro.
 */

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  /** Contador opcional exibido ao lado do rotulo, ex.: "Abertos (3)". */
  count?: number;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Pilula escura com a aba ativa em destaque. */
export function SegmentedTabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border/70 bg-secondary/40 p-1',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'focus-ring rounded-full px-4 py-2 text-xs font-bold transition-all duration-200',
              active
                ? 'bg-foreground text-background shadow-soft'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span className={cn('ml-1.5', active ? 'opacity-70' : 'opacity-60')}>
                ({item.count})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Abas em PILULAS INDIVIDUAIS — uma borda por aba, a ativa preta e sem borda.
 *
 * ================== O TERCEIRO PADRAO, E POR QUE ELE NAO E `SegmentedTabs` ==================
 *
 * `SegmentedTabs` tem UM trilho so: uma borda clara envolvendo as opcoes e um `p-1`
 * de respiro dentro. O print de `Conteudo do Site` mostra SETE pilulas, CADA UMA com
 * borda propria e um vao entre elas — sem trilho nenhum em volta.
 *
 * Nao da para chegar nas duas com o mesmo componente sem uma prop que troque o trilho
 * pela borda-por-item. E essa prop seria a "prop de teste" que o modulo Provador
 * recusou: muda o produto para o componente servir a duas telas, em vez de as duas
 * telas ficarem com o que o print mostra. Dois componentes, cada um com o seu
 * desenho, e a conta honesta.
 *
 * ================== A ATIVA NAO ENCOSTA ==================
 *
 * A pilula ativa e `bg-foreground text-background` e as inativas sao
 * `border-border bg-background`. Nos dois estados a ALTURA e a mesma (`h-10`), e nao
 * o `py` de cada uma: com `py`, a ativa — que nao tem borda — ficaria 2px mais baixa
 * que as vizinhas, e no print as sete estao alinhadas. Altura fixa no lugar de
 * padding e o que mantem o alinhamento.
 *
 * ================== ROLAGEM HORIZONTAL ==================
 *
 * Sao sete rotulos, e `Banners Promocionais` e `Seções da Home` sao longos. Em tela
 * estreita as sete nao cabem, e o `overflow-x-auto` deixa a faixa rolar em vez de
 * quebrar em duas linhas. No print a faixa tem uma linha so.
 */
export function PillTabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn('flex items-center gap-2 overflow-x-auto pb-1', className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'focus-ring h-10 shrink-0 whitespace-nowrap rounded-full px-5 text-xs font-bold transition-colors duration-200',
              active
                ? 'bg-foreground text-background'
                : 'border border-border bg-background text-foreground hover:bg-secondary/60',
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span className={cn('ml-1.5', active ? 'opacity-70' : 'opacity-60')}>
                ({item.count})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Abas com sublinhado, para navegacao interna de um modulo. */
export function UnderlineTabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(event: React.KeyboardEvent) {
    const index = items.findIndex((item) => item.value === value);
    if (index < 0) return;
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    onChange(items[next].value);
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[next]?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn('flex items-center gap-6 overflow-x-auto border-b border-border/60', className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            id={`${baseId}-${item.value}`}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              'focus-ring relative shrink-0 whitespace-nowrap pb-3 text-sm font-bold transition-colors duration-200',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? <span className="ml-1 opacity-60">({item.count})</span> : null}
            {active ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
