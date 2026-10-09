'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

/**
 * O modal `Ganhe 10% OFF` — print `003828`.
 *
 * ================== E O UNICO BLOCO DO SITE QUE OS 14 PRINTS MOSTRAM ABERTO ==================
 *
 * O print `003828` e a Home com este modal sobre ela; o `003840` e a MESMA Home
 * com ele fechado. E por isso o unico elemento do site cuja existencia depende de
 * ESTADO — e o unico que precisa de `'use client'` para existir.
 *
 * ================== O QUE ELE FAZ, E O QUE ELE NAO FAZ ==================
 *
 * **FAZ:** aparece depois de 6 segundos (o `setTimeout` do original), fecha no
 * `X` e no `não, obrigada`, e **nao volta na mesma sessao** — o original grava
 * `closet-lunar-popup-seen` no `sessionStorage` e checa antes de agendar.
 *
 * **NAO FAZ:** gravar o contato. O original insere em `leads` pelo `supabase` e
 * cai num `toast.success("Cupom enviado! Use PRIMEIRA10")`. Aqui nao ha banco
 * (Fase 4) nem captura de lead — entao o `QUERO MEU DESCONTO` **nao promete um
 * cupom que nao foi enviado**. Ele avisa que o cadastro entra na integracao, e a
 * bancada prova que a frase `Cupom enviado` NAO aparece em lugar nenhum. E a
 * mesma escolha do `Copiar` da tela `Afiliada`: o botao existe, e nao mente.
 *
 * `sessionStorage` e do NAVEGADOR, e nao a restricao de armazenamento dos
 * artefatos — aqui e uma pagina de verdade, no disco.
 */
const CHAVE = 'closet-lunar-popup-visto';

export function LeadPopup() {
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem(CHAVE)) return;
    const t = setTimeout(() => setAberto(true), 6000);
    return () => clearTimeout(t);
  }, []);

  function fechar() {
    try {
      window.sessionStorage.setItem(CHAVE, '1');
    } catch {
      /* sessao privada pode recusar a escrita; o modal ainda fecha. */
    }
    setAberto(false);
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-lg bg-background shadow-2xl">
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="focus-ring absolute right-3 top-3 z-10 rounded p-1"
        >
          <X className="size-5" aria-hidden />
        </button>

        <div className="bg-secondary px-8 pb-6 pt-10 text-center">
          <Sparkles className="mx-auto mb-2 size-6 text-accent" aria-hidden />
          <h2 className="font-serif text-3xl">Ganhe 10% OFF</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            na sua primeira compra na Closet Lunar
          </p>
        </div>

        <form
          className="space-y-3 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setAviso('O cadastro entra na fase de integração — o cupom ainda não é enviado por aqui.');
          }}
        >
          <input
            required
            name="nome"
            placeholder="Seu nome"
            aria-label="Seu nome"
            className="w-full rounded border border-border px-3 py-2 text-sm placeholder:text-placeholder"
          />
          <input
            required
            name="whatsapp"
            placeholder="WhatsApp"
            aria-label="WhatsApp"
            className="w-full rounded border border-border px-3 py-2 text-sm placeholder:text-placeholder"
          />
          <input
            required
            type="email"
            name="email"
            placeholder="E-mail"
            aria-label="E-mail"
            className="w-full rounded border border-border px-3 py-2 text-sm placeholder:text-placeholder"
          />
          <button
            type="submit"
            className="w-full rounded bg-foreground py-3 text-sm font-medium tracking-wide text-background transition-opacity hover:opacity-90"
          >
            QUERO MEU DESCONTO
          </button>
          <button
            type="button"
            onClick={fechar}
            className="block w-full text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            não, obrigada
          </button>

          {aviso && <p className="text-center text-xs italic text-muted-foreground">{aviso}</p>}
        </form>
      </div>
    </div>
  );
}
