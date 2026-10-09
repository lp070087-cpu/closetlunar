'use client';

import { useState } from 'react';
import { SectionHeader } from '@/components/ui/card';
import { PENDING_REASON, applyTheme } from '@/lib/conteudo/data';
import { ThemeCard } from './theme-card';
import type { StoreTheme } from '@/lib/conteudo/types';

/**
 * `/admin/personalizar-loja` — adm-060.
 *
 * ================== A TELA E UM TITULO, UM SUBTITULO E TRES CARTOES ==================
 *
 * Nao ha mais nada. O subtitulo do print e explicito sobre o que NAO esta aqui:
 *
 *     "Escolha o tema visual da Closet Lunar. Esta etapa aplica cores e tipografia.
 *      Editor avançado, preview, publicação e histórico chegam nas próximas etapas."
 *
 * Ou seja: o material DIZ que editor de cores, preview e publicacao nao existem ainda.
 * Entao esta tela nao os inventa — ela faz a unica coisa que o print mostra: escolher
 * um dos tres temas, o que muda qual cartao diz `Tema atual`.
 *
 * ================== `Aplicar tema` E LOCAL, E O AVISO DIZ ISSO ==================
 *
 * `applyTheme` nao grava: ele troca o tema ativo do ESTADO da tela, e a faixa avisa que
 * a escolha nao foi publicada. A distincao importa porque o botao se chama "aplicar" —
 * e o que ele aplica e a escolha AQUI, nao a loja. Publicar e justamente uma das coisas
 * que o subtitulo promete para uma etapa seguinte.
 *
 * ================== A `Closet LUNAR`, COM UM N ==================
 *
 * O subtitulo deste print escreve `Closet Lunar` (um `n`), como a aba `Instagram`
 * (adm-058) e ao contrario do `Closet LUNNAR` do projeto e do `@closetlunnar` (dois n)
 * do rodape. E transcrito como esta — a divergencia vai para o relatorio. Ver a nota
 * longa em `demo.ts`.
 */
export function PersonalizarView({
  initial,
  initialActiveId,
}: {
  initial: StoreTheme[];
  initialActiveId: string;
}) {
  const [themes] = useState<StoreTheme[]>(initial);
  const [activeId, setActiveId] = useState(initialActiveId);
  const [notice, setNotice] = useState('');

  async function apply(id: string) {
    const result = await applyTheme(id);
    setActiveId(id);
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
  }

  return (
    <div className="space-y-6 motion-safe:animate-fade-in">
      <SectionHeader
        title="Personalizar Loja"
        description="Escolha o tema visual da Closet Lunar. Esta etapa aplica cores e tipografia. Editor avançado, preview, publicação e histórico chegam nas próximas etapas."
      />

      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-warning/40 bg-warning-surface px-4 py-3 text-xs text-foreground"
        >
          {notice}
        </p>
      ) : null}

      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {themes.map((theme) => (
          <li key={theme.id}>
            <ThemeCard
              theme={theme}
              active={theme.id === activeId}
              onApply={() => void apply(theme.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
