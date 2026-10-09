'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input } from '@/components/ui/form';
import { SectionHeader } from '@/components/ui/card';
import { instagramHandle } from '@/lib/conteudo/metrics';
import { isAcceptableInstagram } from '@/lib/conteudo/form';
import { PENDING_REASON, saveInstagram } from '@/lib/conteudo/data';
import type { InstagramConfig } from '@/lib/conteudo/types';

/**
 * A ABA `Instagram` — adm-058.
 *
 * ================== UM FORMULARIO, E NAO UMA LISTA ==================
 *
 * Esta aba e um formulario de DOIS campos que termina em `Salvar`. E o que a
 * distingue das cinco abas de lista: la o cabecalho tem `+ Novo …`, aqui tem
 * `Salvar`. As duas ultimas abas (Instagram e Rodape) sao assim; as cinco primeiras
 * nao.
 *
 * ================== A LINHA DE APOIO E O `instagramHandle` ==================
 *
 * `Usuário detectado: @closetlunar` NAO e texto decorativo: ele confirma, antes de
 * salvar, QUAL conta a loja vai exibir. Se a URL tiver um `?igshid=`, o nome de outra
 * conta ou um dominio que nao e o Instagram, a linha muda — ou desaparece, que e o
 * caso de `''`. Ver `instagramHandle` em `metrics.ts`.
 *
 * Ela SOME quando o campo esta vazio (`''`), e nao mostra `@`: mostrar um `@` sem nome
 * seria uma confirmacao que nao confirma nada.
 *
 * ================== DEFEITO CORRIGIDO: O `Salvar` ESTAVA NO CABECALHO ==================
 *
 * A versao anterior punha `Salvar` no `action` do `SectionHeader`, ao lado do titulo.
 * O `235810.png` desmente: `Salvar` e a ULTIMA coisa do formulario, ABAIXO do checkbox
 * `Exibir feed na Home`, e o cabecalho `Instagram` esta sozinho. E a mesma posicao do
 * `Salvar` do Rodape (adm-059) — botao no fim do formulario, nao no topo.
 *
 * A confusao veio de `CONTEUDO_ACTIONS`, que lista `Instagram: 'Salvar'` e
 * `Rodape: 'Salvar'` junto dos `+ Novo …` das cinco abas de lista. Aquela tabela existe
 * para provar QUAL e o rotulo do botao (um `Salvar` e nao um `+ Novo`), nao ONDE ele
 * fica. Onde ele fica o print decide — e o print o poe embaixo, nos dois formularios.
 *
 * ================== O CHECKBOX E AZUL NATIVO ==================
 *
 * `rgb(0,117,255)`, como o `Banner Ativo` de adm-052. Por isso `accent-auto`. Ver a
 * nota longa em `banner-form.tsx` — inclusive por que isso so funciona porque o `cn`
 * do projeto e um `twMerge`.
 *
 * ================== A GRAFIA: `closetlunar`, UM N ==================
 *
 * A URL do print tem um `n`, e o `Usuário detectado` repete. A aba `Rodape` (adm-059)
 * escreve o mesmo perfil com DOIS. As duas telas divergem, e as duas ficam como estao
 * — ver `DEMO_INSTAGRAM` em `demo.ts`. O campo NAO e normalizado ao carregar.
 */
export function InstagramPanel({ initial }: { initial: InstagramConfig }) {
  const [url, setUrl] = useState(initial.url);
  const [showOnHome, setShowOnHome] = useState(initial.showOnHome);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const handle = instagramHandle(url);

  async function submit() {
    if (!isAcceptableInstagram(url)) {
      setError('Informe uma URL do Instagram (instagram.com/conta) ou um @usuário.');
      return;
    }
    setError('');
    const result = await saveInstagram({ url: url.trim(), showOnHome });
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Instagram" />

      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-warning/40 bg-warning-surface px-4 py-3 text-xs text-foreground"
        >
          {notice}
        </p>
      ) : null}

      <div className="max-w-xl space-y-4">
        <Field label="URL completa do Instagram" htmlFor="instagram-url" error={error}>
          <Input
            id="instagram-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="h-11"
          />
        </Field>

        {handle ? (
          <p className="text-[13px] text-muted-foreground">Usuário detectado: {handle}</p>
        ) : null}

        <Checkbox
          checked={showOnHome}
          onChange={(event) => setShowOnHome(event.target.checked)}
          label="Exibir feed na Home"
          className="accent-auto"
        />

        <Button onClick={() => void submit()} className="uppercase tracking-[0.12em]">
          Salvar
        </Button>
      </div>
    </div>
  );
}
