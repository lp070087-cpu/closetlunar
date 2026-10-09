'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/card';
import { ListRow, ListStack } from './list-row';
import { EmptyLine } from './empty-line';
import { PROMO_EMPTY_TEXT } from '@/lib/conteudo/demo';
import type { PromoBanner } from '@/lib/conteudo/types';

/**
 * A ABA `Banners Promocionais` — adm-056.
 *
 * ================== A LISTA ESTA VAZIA NO PRINT, E A TELA MOSTRA O VAZIO ==================
 *
 * E o unico estado que o material oferece desta aba: o titulo, o botao `+ Novo banner`
 * e uma linha cinza. A linha E o desenho — nao ha icone, nao ha caixa, nao ha
 * centralizacao (ver `empty-line.tsx`).
 *
 * Inventar tres banners de exemplo aqui encheria a tela e esconderia exatamente o que
 * falta: o formulario. Uma lista de exemplo numa tela que o print mostra vazia faz a
 * tela PARECER pronta.
 *
 * ================== O BOTAO NAO ABRE MODAL, PELO MESMO MOTIVO DE `Secoes da Home` ==================
 *
 * Nao ha captura do formulario de banner promocional. Ver a nota longa em
 * `secoes-da-home.tsx` — o raciocinio e o mesmo, e vale para as duas abas.
 *
 * A DIFERENCA entre as duas: `Seções da Home` tem DUAS linhas preenchidas no print, e
 * esta tem ZERO. Entao aqui a bancada prova o estado vazio com dado real, e prova que a
 * lista aceita linhas quando elas existirem (`DEMO_PROMO_BANNERS` e `never[]` de
 * proposito, para que o tipo nao "grude" no array vazio).
 */
export function PromoBanners({ initial }: { initial: PromoBanner[] }) {
  const [banners] = useState<PromoBanner[]>(initial);
  const [notice, setNotice] = useState('');

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Banners Promocionais"
        action={
          <Button
            onClick={() =>
              setNotice(
                'O formulário de novo banner promocional não está nas capturas deste módulo — a criação fica pendente até haver referência.',
              )
            }
            className="uppercase tracking-[0.12em]"
          >
            + Novo banner
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

      {banners.length === 0 ? (
        <EmptyLine text={PROMO_EMPTY_TEXT} />
      ) : (
        <ListStack>
          {banners.map((banner) => (
            <ListRow key={banner.id}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold leading-tight text-foreground">
                  {banner.title}
                </p>
                <p className="mt-0.5 truncate text-[13px] leading-snug text-muted-foreground">
                  {banner.subtitle}
                </p>
              </div>
            </ListRow>
          ))}
        </ListStack>
      )}
    </div>
  );
}
