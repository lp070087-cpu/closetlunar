import Link from 'next/link';
import { getFooter } from '@/lib/conteudo/data';

/**
 * O rodape completo da loja — a faixa preta do Instagram e o rodape de verdade.
 *
 * ================== ELE NAO EXISTE NO PAINEL DO CLIENTE, E ISSO E DO MATERIAL ==================
 *
 * A Fase 2 registrou, em `components/cliente/store-footer.tsx`, que a area da
 * cliente termina numa faixa preta com `@closetlunar` e NADA MAIS — e o material
 * prova isso, porque `cli-003`, `cli-005` e `cli-007` sao capturas roladas ate o
 * fim. O rodape inteiro (newsletter, quatro colunas, copyright) so aparece no
 * SITE, e o print `004049` o mostra completo.
 *
 * Por isso este componente existe AQUI e nao substitui o da area da cliente: sao
 * dois rodapes diferentes porque sao duas areas diferentes, e o material mostra
 * os dois.
 *
 * ================== O QUE VEM DO PRINT `004049` ==================
 *
 * A marca `Closet Lunar` com os tres icones sociais; `Receba nossas novidades
 * por e-mail` + `Cadastre-se agora!` + os tres campos (`Nome completo`,
 * `WhatsApp`, `E-mail`) e o botao `OK`; as quatro colunas (`Sobre a Closet
 * Lunar` com o texto, `Departamentos`, `Ajuda e Suporte`, `Atendimento`); e
 * `© 2026 Closet Lunar. Todos os direitos reservados.`
 *
 * O telefone (`5581998817397`) e o `@closetlunar` vem do `getFooter()` — o MESMO
 * dado que o painel do admin edita em `Conteúdo do Site`. Escrever o numero aqui
 * criaria uma segunda verdade que divergiria no primeiro ajuste do admin.
 */

/** Os cinco departamentos do print — todos apontam para a categoria deles. */
const DEPARTAMENTOS = [
  { label: 'Conjuntos', href: '/categoria/conjuntos' },
  { label: 'Leggings', href: '/categoria/leggings' },
  { label: 'Tops', href: '/categoria/tops' },
  { label: 'Shorts', href: '/categoria/shorts' },
  { label: 'Streetwear', href: '/categoria/streetwear' },
] as const;

/**
 * Os cinco itens de `Ajuda e Suporte`.
 *
 * O material NAO tem as paginas de politica, troca nem contato — nenhuma rota
 * dessas existe no original nem nos prints. Elas apontam para `/sobre`, que e a
 * pagina institucional que o original tem. Um `href="/trocas"` seria o "link
 * interno falso" que a condicao de conclusao da Fase 3 proibe; apontar para a
 * pagina que existe e o que nao mente.
 */
const AJUDA = [
  { label: 'Sobre nós', href: '/sobre' },
  { label: 'Trocas e devoluções', href: '/sobre' },
  { label: 'Política de privacidade', href: '/sobre' },
  { label: 'Pagamento e frete', href: '/sobre' },
  { label: 'Contato', href: '/sobre' },
] as const;

export async function SiteFooter() {
  const { data: footer } = await getFooter();

  return (
    <>
      {/* A faixa escura do Instagram — a mesma do print `004049`. */}
      <section className="bg-foreground py-12 text-center text-background">
        <IconeInstagram className="mx-auto size-5" />
        <p className="mt-2 text-xs uppercase tracking-[0.2em] opacity-70">Siga-nos no Instagram</p>
        <p className="mt-1 font-serif text-2xl">@{footer.instagram.replace(/^@/, '')}</p>
      </section>

      <footer className="border-t border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="font-serif text-3xl tracking-tight">
              Closet <span className="italic">Lunar</span>
            </p>
            <div className="mt-5 flex items-center gap-3 text-muted-foreground">
              <a href={footer.instagram} aria-label="Instagram" className="focus-ring rounded p-1">
                <IconeInstagram className="size-5" />
              </a>
              <a href={footer.instagram} aria-label="TikTok" className="focus-ring rounded px-1 text-base">
                ♪
              </a>
              <a
                href={footer.instagram}
                aria-label="YouTube"
                className="focus-ring rounded px-1 text-[13px]"
              >
                ▶
              </a>
            </div>
          </div>

          {/*
            NEWSLETTER. Os tres campos e o `OK` existem e NAO GRAVAM: nao ha
            provider de e-mail nesta fase — ver `AGUARDA PROVIDER` no STATUS.
            O `OK` e um botao de submit sem `action`, e a bancada o trata como
            alvo, nao como fluxo: nenhuma promessa de cadastro que nao houve.
          */}
          <div>
            <p className="text-sm font-medium">Receba nossas novidades por e-mail</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Cadastre-se agora!</p>
            <form className="mt-4 flex flex-wrap gap-2">
              <input
                type="text"
                name="nome"
                aria-label="Nome completo"
                placeholder="Nome completo"
                className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-4 text-sm placeholder:text-placeholder"
              />
              <input
                type="tel"
                name="whatsapp"
                aria-label="WhatsApp"
                placeholder="WhatsApp"
                className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-4 text-sm placeholder:text-placeholder"
              />
              <input
                type="email"
                name="email"
                aria-label="E-mail"
                placeholder="E-mail"
                className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-4 text-sm placeholder:text-placeholder"
              />
              <button
                type="submit"
                className="h-11 rounded-lg bg-foreground px-6 text-xs font-bold uppercase tracking-widest text-background"
              >
                OK
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 border-t border-border px-4 py-12 md:grid-cols-4">
          <div>
            <p className="text-sm font-semibold">Sobre a Closet Lunar</p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Moda fitness e streetwear feminino com estética clean e sofisticada. Peças pensadas
              para mulheres que buscam conforto, confiança e estilo.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Departamentos</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {DEPARTAMENTOS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Ajuda e Suporte</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {AJUDA.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Atendimento</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <IconeTelefone className="size-4 shrink-0" />
                {formatarTelefone(footer.whatsapp)}
              </li>
              <li className="flex items-center gap-2">
                <IconeEnvelope className="size-4 shrink-0" />
                E-mail
              </li>
              <li className="flex items-center gap-2">
                <IconePin className="size-4 shrink-0" />
                Atendimento online
              </li>
              <li className="flex items-center gap-2">
                <IconeRelogio className="size-4 shrink-0" />
                Seg. a Sex. 9h–18h
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          © 2026 Closet Lunar. Todos os direitos reservados.
        </div>
      </footer>
    </>
  );
}

/**
 * O numero do rodape, formatado para leitura.
 *
 * O dado guardado e o digito cru `5581998817397` — e o que o painel edita, sem
 * `+` e sem formatacao. Sem digito suficiente para os tres grupos, devolve o
 * CRU: inventar parentese para um numero curto seria pior que mostrar o que ha.
 */
export function formatarTelefone(digitos: string): string {
  const d = String(digitos ?? '').replace(/\D/g, '');
  if (d.length < 12) return digitos;
  // 5581998817397 -> +55 (81) 99881-7397
  return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
}

/* ------------------------------- icones em linha -------------------------------
 *
 * Desenhados aqui em SVG e nao importados: o `lucide-react` nao tem TikTok, e os
 * quatro do bloco de atendimento (`telefone`, `envelope`, `pin`, `relogio`)
 * aparecem uma vez cada. Um icone a mais do que o print mostra seria invencao —
 * e estes sao os quatro do print, na ordem dele.
 */

function IconeInstagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconeTelefone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M5 3h3l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function IconeEnvelope({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function IconePin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function IconeRelogio({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}
