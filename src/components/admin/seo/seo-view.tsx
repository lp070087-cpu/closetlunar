'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { SectionHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSeoConfig, saveSeoConfig } from '@/lib/seo/data';
import { applySeoChange, ogImageFromFile } from '@/lib/seo/metrics';
import type { SeoConfig } from '@/lib/seo/types';
import { GooglePanel, MetaTagsPanel, OpenGraphPanel, SeoTechnicalCard } from './seo-panels';

/**
 * A tela de SEO & Google (`/admin/seo`) — adm-084.
 *
 * ================== DUAS COLUNAS: METADE META TAGS, METADE GOOGLE ==================
 *
 * O print divide a tela em duas colunas iguais (`lg:grid-cols-2`): à esquerda
 * `Meta Tags Globais` e `Redes Sociais (Open Graph)`; à direita
 * `Integrações Google`, o cartão verde e o botão `SALVAR SEO` alinhado à direita.
 * Abaixo de `lg` as colunas empilham, como no original.
 *
 * ================== O BOTÃO CARREGA O `Check` E O TEXTO EM CAIXA ALTA ==================
 *
 * O print mostra o ícone de check antes de `SALVAR SEO`. A caixa alta é do CSS
 * (`Button` sobe a caixa das variantes `primary`/`outline`) — o texto vai em caixa
 * normal no código, como em todos os botões do painel.
 */
export function SeoView() {
  const [config, setConfig] = useState<SeoConfig | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let vivo = true;
    getSeoConfig().then((res) => {
      if (vivo) setConfig(res.data);
    });
    return () => {
      vivo = false;
    };
  }, []);

  /**
   * O `Upload` abre o seletor de arquivo do navegador. Como não há storage (fora de
   * escopo), o arquivo NÃO sobe: o nome escolhido vai para o campo de baixo, que é o
   * caminho que o original percorre quando o `ImageField` resolve.
   */
  function escolherArquivo() {
    inputArquivo.current?.click();
  }

  function receberArquivo(escolhido: string | null) {
    const valor = ogImageFromFile(escolhido);
    if (valor === null || config === null) return;
    setConfig(applySeoChange(config, 'ogImageUpload', valor));
  }

  function salvar() {
    if (config === null) return;
    setSalvando(true);
    saveSeoConfig(config).then((res) => {
      setSalvando(false);
      setAviso(res.reason);
    });
  }

  if (config === null) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="SEO & Google"
          description="Otimize a visibilidade da Closet Lunna nos motores de busca"
        />
        <p className="surface p-10 text-center text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="SEO & Google"
        description="Otimize a visibilidade da Closet Lunna nos motores de busca"
      />

      <input
        ref={inputArquivo}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          receberArquivo(event.target.files?.[0]?.name ?? null);
          event.target.value = '';
        }}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <MetaTagsPanel
            config={config}
            onChange={(proximo) => setConfig(proximo)}
          />
          <OpenGraphPanel
            config={config}
            onChange={(proximo) => setConfig(proximo)}
            onUpload={escolherArquivo}
          />
        </div>

        <div className="space-y-8">
          <GooglePanel config={config} onChange={(proximo) => setConfig(proximo)} />
          <SeoTechnicalCard />

          <div className="flex flex-col items-end gap-3">
            {aviso ? (
              <p role="status" className="text-xs text-warning">
                {aviso}
              </p>
            ) : null}
            <Button variant="primary" size="lg" disabled={salvando} onClick={salvar}>
              <Check className="size-4" aria-hidden />
              {salvando ? 'Salvando…' : 'Salvar SEO'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
