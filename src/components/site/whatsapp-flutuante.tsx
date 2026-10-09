import { getFooter } from '@/lib/conteudo/data';
import { phoneDigits } from '@/lib/whatsapp/metrics';

/**
 * O botao verde flutuante do WhatsApp — o circulo que aparece em TODOS os 14
 * prints, sempre no canto inferior direito.
 *
 * ================== E UM LINK, E NAO UMA INTEGRACAO ==================
 *
 * `wa.me/<numero>` e o link publico do WhatsApp: ele abre o aplicativo (ou o
 * WhatsApp Web) com a conversa e a mensagem ja escritas. **Nao ha API, nao ha
 * provider, nao ha token.** E por isso que ele existe nesta fase sem violar a
 * regra de integracoes externas: o que ele faz e o mesmo que um link `mailto:`
 * faz — entrega a conversa ao aplicativo do usuario, e nao envia nada por conta
 * propria. A bancada prova que o `href` comeca com `https://wa.me/`.
 *
 * O numero vem do `getFooter()` — o MESMO que o painel do admin edita. E a mesma
 * decisao do rodape: escrever o numero aqui seria uma segunda verdade.
 *
 * ================== A MENSAGEM PADRAO ==================
 *
 * O original monta a mensagem por um template configuravel
 * (`settings.whatsapp_templates`). Nesta fase ha UM template de fallback
 * (`lib/whatsapp/metrics.ts`, `TEMPLATE_LABELS`) e o projeto ainda nao tem o
 * template do botao flutuante. A mensagem escrita aqui e a de saudacao, literal
 * do fallback do original; quando o template entrar, ela sai daqui.
 */
export async function WhatsappFlutuante() {
  const { data: footer } = await getFooter();
  const numero = phoneDigits(footer.whatsapp);
  const texto = encodeURIComponent('Olá! Vim pelo site da Closet Lunar e gostaria de atendimento.');

  return (
    <a
      href={numero ? `https://wa.me/${numero}?text=${texto}` : 'https://wa.me/'}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      <IconeWhatsapp className="size-7" />
    </a>
  );
}

/** O glifo do WhatsApp. Desenhado aqui: o `lucide-react` nao o tem. */
function IconeWhatsapp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.42 1.3-1.96 1.35-.5.05-1.13.07-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.15-.2-1.19-1.58-1.19-3.01 0-1.43.75-2.14 1.02-2.43.26-.29.57-.36.76-.36l.55.01c.18.01.41-.07.64.49.24.58.81 2.01.88 2.16.07.15.12.32.02.51-.1.2-.15.32-.29.49-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.35 1.45.29.15.46.13.63-.08.17-.2.73-.85.93-1.14.2-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.12.07.7-.17 1.38Z" />
    </svg>
  );
}
