'use client';

import { AlertTriangle } from 'lucide-react';

/**
 * O AVISO DE QUE NADA FOI GRAVADO — e ele NAO e generico.
 *
 * Campanhas tem um aviso so, porque la a escrita e uma coisa so. Aqui sao TRES
 * botoes de gravacao em duas telas, e as consequencias sao de tamanhos diferentes:
 *
 *   `Salvar Regras`      decide quantos pontos a LOJA INTEIRA passa a dar.
 *   `Salvar Recompensas` e `Salvar Configuração do Clube VIP` mudam a LISTA de
 *                        recompensas e os niveis, e nao tocam no acumulo.
 *
 * Um aviso unico dizendo "nao foi gravado" deixaria a pessoa sem saber se o
 * `Pontos por R$ 1,00` que ela acabou de mudar vale ou nao — e essa e a pergunta
 * que ela vai fazer. Por isso sao dois avisos com textos diferentes, e nao um.
 *
 * O AVISO NAO VEM DE PRINT NENHUM. Ele existe porque ha um botao de salvar e nao
 * ha banco, e porque o original mostra `toast.success("Regras salvas")` logo
 * depois do `upsert` — confirmacao que, sem Neon, seria mentira. Ver `data.ts`.
 *
 * NAO EXISTE AQUI um aviso que se apaga sozinho. Ele fica visivel depois do
 * clique, e some quando a pessoa edita de novo — que e a unica hora em que a
 * frase "nao foi gravado" deixa de ser verdade.
 */
export function UnsavedNotice({
  kind,
  visible,
}: {
  kind: 'rules' | 'rewards' | 'tiers';
  visible: boolean;
}) {
  if (!visible) return null;

  const texto =
    kind === 'rules'
      ? 'As regras foram aplicadas somente nesta tela, mas não foram gravadas no banco. Enquanto o Neon não estiver conectado, o acúmulo de pontos da loja não muda.'
      : kind === 'rewards'
        ? 'A lista de resgates foi alterada apenas nesta tela, mas não foi gravada no banco. As recompensas não ficam disponíveis para as clientes enquanto o Neon não estiver conectado.'
        : 'A configuração do Clube VIP foi alterada apenas nesta tela, mas não foi gravada no banco. Os níveis não valem na loja enquanto o Neon não estiver conectado.';

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-surface/50 p-4 text-xs"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden />
      <p className="text-warning-foreground">{texto}</p>
    </div>
  );
}
