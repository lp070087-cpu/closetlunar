'use client';

import { Check } from 'lucide-react';
import { Field, FieldGrid, Input, Textarea } from '@/components/ui/form';
import { SEO_CHECKLIST, SEO_LIMITS } from '@/lib/seo/metrics';
import type { SeoConfig } from '@/lib/seo/types';

/**
 * ================== POR QUE AS SEÇÕES SÃO `h3`, E NÃO O `SectionHeader` ==================
 *
 * O print usa DOIS níveis de título na mesma tela: o `SEO & Google` grande do topo
 * (`SectionHeader` do `seo-view`) e os títulos de seção (`Meta Tags Globais`,
 * `Redes Sociais (Open Graph)`, `Integrações Google`) um degrau abaixo. Se todas
 * fossem `SectionHeader`, o `font-serif text-3xl` sairia igual nos dois níveis e a
 * hierarquia do print desapareceria. Um `h3` em serifa menor é o que reproduz a
 * diferença — e é o mesmo arranjo que o `SettingsAdmin` do original usa.
 */
function SeoSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header>
        <h3 className="font-serif text-xl tracking-tight">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}

/**
 * `Meta Tags Globais` — os três campos de texto, com as duas recomendações fixas.
 *
 * NÃO há contador ao vivo: o print mostra só a frase (`Recomendado: até 60
 * caracteres.`). Um `38/60` seria invenção.
 */
export function MetaTagsPanel({
  config,
  onChange,
}: {
  config: SeoConfig;
  onChange: (config: SeoConfig) => void;
}) {
  return (
    <SeoSection title="Meta Tags Globais" description="Título e descrição padrão que aparecem no Google">
      <div className="space-y-5">
        <Field label="Título do site (SEO Title)" hint={SEO_LIMITS.title}>
          <Input
            value={config.seoTitle}
            onChange={(event) => onChange({ ...config, seoTitle: event.target.value })}
            placeholder="Ex: Closet Lunna — Moda Fitness e Streetwear Feminino"
          />
        </Field>

        <Field label="Meta descrição" hint={SEO_LIMITS.description}>
          <Textarea
            rows={3}
            value={config.seoDescription}
            onChange={(event) => onChange({ ...config, seoDescription: event.target.value })}
            placeholder="Descreva sua loja em poucas frases..."
          />
        </Field>

        <Field label="Palavras-chave (Keywords)">
          <Input
            value={config.seoKeywords}
            onChange={(event) => onChange({ ...config, seoKeywords: event.target.value })}
            placeholder="Ex: moda fitness, academia, legging, tops, streetwear"
          />
        </Field>
      </div>
    </SeoSection>
  );
}

/**
 * `Redes Sociais (Open Graph)` — os DOIS campos de imagem mais o botão `Upload`.
 *
 * O botão dispara o seletor de arquivo do navegador. Não há upload real (sem
 * storage — fora de escopo); o que ele faz é preencher o campo de baixo com o nome
 * do arquivo escolhido, que é o caminho que o original percorre quando o
 * `ImageField` resolve. O `onUpload` recebe o nome, ou `null` se o seletor fechar
 * sem escolha.
 */
export function OpenGraphPanel({
  config,
  onChange,
  onUpload,
}: {
  config: SeoConfig;
  onChange: (config: SeoConfig) => void;
  onUpload: () => void;
}) {
  return (
    <SeoSection
      title="Redes Sociais (Open Graph)"
      description="Como a loja aparece quando compartilhada no WhatsApp/Instagram"
    >
      <div>
        <p className="label-caps">Imagem de compartilhamento (OG Image)</p>
        <div className="mt-2 space-y-2">
          <Input
            aria-label="URL da imagem de compartilhamento"
            value={config.ogImageUrl}
            onChange={(event) => onChange({ ...config, ogImageUrl: event.target.value })}
            placeholder="URL da imagem (1200×630px)"
          />

          <FieldGrid columns={1} className="sm:grid-cols-[1fr_auto] sm:items-center">
            <Input
              aria-label="URL da imagem enviada"
              value={config.ogImageUpload}
              onChange={(event) => onChange({ ...config, ogImageUpload: event.target.value })}
              placeholder="URL da imagem"
            />
            <button
              type="button"
              onClick={onUpload}
              className="focus-ring h-11 rounded-xl border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-secondary/70"
            >
              Upload
            </button>
          </FieldGrid>
        </div>
      </div>
    </SeoSection>
  );
}

/**
 * `Integrações Google` — os três IDs.
 *
 * Os três usam `font-mono` no original, porque `G-XXXXXXXXXX`, `GTM-XXXXXXX` e o
 * código de verificação são identificadores, não texto corrido.
 */
export function GooglePanel({
  config,
  onChange,
}: {
  config: SeoConfig;
  onChange: (config: SeoConfig) => void;
}) {
  return (
    <SeoSection
      title="Integrações Google"
      description="Conecte as ferramentas de análise e indexação"
    >
      <div className="space-y-5">
        <Field label="Google Analytics 4 (GA ID)">
          <Input
            className="font-mono"
            value={config.gaId}
            onChange={(event) => onChange({ ...config, gaId: event.target.value })}
            placeholder="Ex: G-XXXXXXXXXX"
          />
        </Field>

        <Field label="Google Tag Manager (GTM ID)">
          <Input
            className="font-mono"
            value={config.gtmId}
            onChange={(event) => onChange({ ...config, gtmId: event.target.value })}
            placeholder="Ex: GTM-XXXXXXX"
          />
        </Field>

        <Field
          label="Google Search Console (Código de Verificação)"
          hint="Usado para indexar a loja e gerar o Sitemap."
        >
          <Input
            className="font-mono"
            value={config.gscVerification}
            onChange={(event) => onChange({ ...config, gscVerification: event.target.value })}
            placeholder="O código de verificação da meta tag"
          />
        </Field>
      </div>
    </SeoSection>
  );
}

/**
 * O cartão verde `SEO Técnico Ativo` — QUATRO afirmações fixas, nenhum campo.
 *
 * O print o desenha em `emerald` com o check e os quatro itens. Ele não reage a
 * nada: é informativo. Por isso não há estado nem prop além das próprias frases.
 */
export function SeoTechnicalCard() {
  return (
    <div className="rounded-2xl border border-success/20 bg-success-surface p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-success-foreground">
        <Check className="size-4" aria-hidden />
        SEO Técnico Ativo
      </h3>
      <ul className="mt-3 space-y-2">
        {SEO_CHECKLIST.map((item) => (
          <li key={item} className="flex gap-2 text-xs text-success-foreground/80">
            <span aria-hidden>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
