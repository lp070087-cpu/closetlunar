'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, FieldGrid } from '@/components/ui/form';
import { SectionHeader } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/modal';
import { PENDING_REASON, saveFooter } from '@/lib/conteudo/data';
import type { FooterLink, FooterPolicy, SiteFooter } from '@/lib/conteudo/types';

/**
 * A ABA `Rodapé` — adm-059.
 *
 * ================== QUATRO INPUTS NUMA GRADE 2x2 ==================
 *
 * O print mostra quatro caixas do MESMO tamanho, em duas linhas de duas:
 *
 *     `5581998871397`      `@closetlunnar`     <- preenchidos
 *     `E-mail`             `Endereço`          <- so placeholder
 *
 * Uma versao anterior do tipo dizia que as duas ultimas NAO eram campos ("texto de
 * lista vazia"). O recorte ampliado de `235816.png` desmentiu: as quatro caixas tem a
 * mesma borda e o mesmo fundo, e `E-mail`/`Endereço` estao na cor de PLACEHOLDER
 * (~`#7E7E7E`), enquanto o telefone esta na tinta normal (~`#14110E`). Quatro
 * `<input>`; dois com valor, dois sem. Ver `SiteFooter` em `types.ts`.
 *
 * ================== E UM FORMULARIO, NAO UMA LISTA ==================
 *
 * Como o `Instagram` (adm-058), esta aba e um formulario, e o botao e `Salvar`. Mas ao
 * contrario das cinco abas de lista, AQUI o `Salvar` NAO fica no cabecalho: o print
 * o coloca ABAIXO de `Políticas`/`Links`, no fim do formulario. Conferido no recorte —
 * o cabecalho `Rodapé` esta sozinho, e o botao preto fecha a tela depois das listas.
 *
 * ================== AS DUAS LISTAS E O `+ Adicionar` ==================
 *
 * `Políticas` e `Links` sao DUAS listas, cada uma com o proprio `+ Adicionar` a
 * direita do titulo. No print as duas estao VAZIAS e nao desenham nada abaixo do
 * titulo — nem linha, nem caixa.
 *
 * O `+ Adicionar` NAO abre modal. Nao ha captura do item de politica nem do item de
 * link, nem do formulario que os cria — mesma classificacao de `Secoes da Home` e
 * `Banners Promocionais`: REFERENCIA INSUFICIENTE. O botao avisa, em vez de inventar
 * dois ou tres campos com rotulos que o material nao mostra.
 *
 * Uma vez que a lista TENHA itens (o que ainda nao acontece), ela desenha as linhas —
 * e por isso o componente ja sabe renderizar `policies`/`links` nao vazios: o vazio de
 * hoje nao pode virar uma parede que impede o dado de amanha.
 */
export function FooterPanel({ initial }: { initial: SiteFooter }) {
  const [footer, setFooter] = useState<SiteFooter>(initial);
  const [notice, setNotice] = useState('');

  async function submit() {
    const result = await saveFooter(footer);
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
  }

  function announceMissingForm(which: 'política' | 'link') {
    setNotice(
      `O formulário de nova ${which} não está nas capturas deste módulo — a criação fica pendente até haver referência.`,
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Rodapé" />

      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-warning/40 bg-warning-surface px-4 py-3 text-xs text-foreground"
        >
          {notice}
        </p>
      ) : null}

      <div className="max-w-[896px] space-y-5">
        <FieldGrid columns={2}>
          <Input
            aria-label="WhatsApp"
            placeholder="WhatsApp"
            value={footer.whatsapp}
            onChange={(event) => setFooter({ ...footer, whatsapp: event.target.value })}
          />
          <Input
            aria-label="Instagram"
            placeholder="Instagram"
            value={footer.instagram}
            onChange={(event) => setFooter({ ...footer, instagram: event.target.value })}
          />
          <Input
            aria-label="E-mail"
            placeholder="E-mail"
            value={footer.email}
            onChange={(event) => setFooter({ ...footer, email: event.target.value })}
          />
          <Input
            aria-label="Endereço"
            placeholder="Endereço"
            value={footer.address}
            onChange={(event) => setFooter({ ...footer, address: event.target.value })}
          />
        </FieldGrid>

        <FooterList
          title="Políticas"
          items={footer.policies}
          onAdd={() => announceMissingForm('política')}
          onRemove={(id) =>
            setFooter({ ...footer, policies: footer.policies.filter((p) => p.id !== id) })
          }
        />

        <FooterList
          title="Links"
          items={footer.links}
          onAdd={() => announceMissingForm('link')}
          onRemove={(id) => setFooter({ ...footer, links: footer.links.filter((l) => l.id !== id) })}
        />

        <Button onClick={() => void submit()} className="uppercase tracking-[0.12em]">
          Salvar
        </Button>
      </div>
    </div>
  );
}

/**
 * UMA DAS DUAS LISTAS DO RODAPE — titulo serifado + `+ Adicionar`, e as linhas quando
 * houver.
 *
 * O VAZIO NAO DESENHA NADA. O print de adm-059 mostra `Políticas` e `Links` como DUAS
 * palavras: nada de linha cinza, nada de caixa, nada de `EmptyState`. E a mesma
 * distincao de `empty-line.tsx` (que existe para as abas de lista, onde o vazio TEM
 * uma frase) — aqui nem a frase existe, entao nao se desenha nada.
 */
function FooterList({
  title,
  items,
  onAdd,
  onRemove,
}: {
  title: string;
  items: (FooterPolicy | FooterLink)[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const target = items.find((item) => item.id === confirming) ?? null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-serif text-xl tracking-tight text-foreground">{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="focus-ring shrink-0 rounded-md text-xs text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
        >
          + Adicionar
        </button>
      </div>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background px-4 py-2.5"
            >
              <span className="min-w-0 truncate text-sm text-foreground">
                {item.label}
                <span className="ml-2 text-muted-foreground">{item.url}</span>
              </span>
              <button
                type="button"
                onClick={() => setConfirming(item.id)}
                aria-label={`Remover ${item.label}`}
                className="focus-ring shrink-0 rounded-md text-xs text-danger transition-colors hover:brightness-90"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <ConfirmModal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) onRemove(confirming);
          setConfirming(null);
        }}
        title={`Remover ${title.toLowerCase().replace(/s$/, '')}`}
        description={target ? `“${target.label}” sai da lista do rodapé.` : undefined}
        confirmLabel="Remover"
        destructive
      />
    </section>
  );
}
