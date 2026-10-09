'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/modal';
import { PENDING_REASON, saveHomeSection } from '@/lib/conteudo/data';
import { bySectionOrder, positionOf } from '@/lib/conteudo/metrics';
import { ListRow, ListStack } from './list-row';
import { EmptyLine } from './empty-line';
import { HomeSectionRow } from './conteudo-rows';
import type { HomeSection } from '@/lib/conteudo/types';

/**
 * A ABA `Seções da Home` — adm-055.
 *
 * ================== NAO HA FORMULARIO, E ISSO E UMA LACUNA REGISTRADA ==================
 *
 * O botao `+ Nova seção` esta no print, mas NAO HA PRINT DO FORMULARIO que ele abre.
 * O modulo tem dois formularios comprovados por captura — o `Novo Banner` (adm-052) e
 * o `Novo look` (adm-062) — e este nao e um deles: nenhuma das capturas deste grupo
 * mostra a tela de criar secao.
 *
 * Entao o botao EXISTE e nao abre modal nenhum. Ele avisa, por escrito, que a tela de
 * criacao nao esta no material. As duas saidas faceis foram descartadas:
 *
 *   inventar o formulario      -> cinco campos que ninguem pediu, com rotulos
 *                                 inventados, parecendo aprovados por print;
 *   remover o botao            -> deixaria a tela mais limpa e menos fiel, e a
 *                                 pendencia sumiria da vista de quem revisa.
 *
 * O criterio do Comando Mestre e explicito para este caso: se a referencia e
 * insuficiente, classifica-se REFERENCIA INSUFICIENTE e registra-se a limitacao. Um
 * botao que avisa e mais honesto que um botao que finge.
 *
 * ================== E POR ISSO ESTA ABA NAO ESCREVE ==================
 *
 * `saveHomeSection` existe na camada de dados e nao e chamada por ninguem: sem
 * formulario, nao ha rascunho para submeter. Ela fica aguardando a captura que falta —
 * e o mesmo estado de `savePromoBanner`.
 *
 * (A linha 1 imprime uma divergencia interna do proprio print — `(best_sellers)` no
 * titulo contra `fonte: featured` na meta. As duas foram transcritas. Ver
 * `HomeSectionRow`.)
 */
export function SecoesDaHome({ initial }: { initial: HomeSection[] }) {
  const [sections, setSections] = useState<HomeSection[]>(() => bySectionOrder(initial));
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState<HomeSection | null>(null);

  const ordered = bySectionOrder(sections);

  function announceMissingForm() {
    setNotice(
      'O formulário de nova seção não está nas capturas deste módulo — a criação fica pendente até haver referência.',
    );
  }

  async function remove() {
    if (!confirming) return;
    setSections((current) => current.filter((c) => c.id !== confirming.id));
    setNotice(PENDING_REASON);
    setConfirming(null);
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Seções da Home"
        action={
          <Button onClick={announceMissingForm} className="uppercase tracking-[0.12em]">
            + Nova seção
          </Button>
        }
      />

      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-warning/40 bg-warning-surface px-4 py-3 text-xs text-foreground"
        >
          {notice}
        </p>
      ) : null}

      {ordered.length === 0 ? (
        <EmptyLine text="Nenhuma seção cadastrada ainda." />
      ) : (
        <ListStack>
          {ordered.map((section) => (
            <ListRow key={section.id}>
              <HomeSectionRow
                section={section}
                order={positionOf(ordered, section)}
                onEdit={announceMissingForm}
                onDelete={() => setConfirming(section)}
              />
            </ListRow>
          ))}
        </ListStack>
      )}

      <ConfirmModal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() => void remove()}
        title="Excluir seção"
        description={
          confirming
            ? `A seção “${confirming.title}” sai da lista. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        destructive
      />
    </div>
  );
}
