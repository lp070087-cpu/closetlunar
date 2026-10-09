import { Trophy } from 'lucide-react';
import type { NivelClube } from '@/lib/cliente/types';

/**
 * O cartao ESCURO de nivel VIP — `NIVEL VIP / BRONZE`.
 *
 * ================== A COR VEM DO DADO, E NAO DO CODIGO ==================
 *
 * O trofeu e o nome do nivel saem na COR DO NIVEL. O original faz
 * `style={{ color: currentTier.color }}` — a cor e uma coluna da tabela
 * `loyalty_tiers`, e nao uma constante. E por isso que este componente recebe
 * `nivel: NivelClube` inteiro em vez de receber um nome e escolher a cor aqui:
 * no dia em que existir `PRATA` e `OURO`, a cor de cada um ja vem do banco, sem
 * tocar neste arquivo.
 *
 * A cor foi medida no print para o nivel que o material mostra: a mediana da
 * palavra `BRONZE` deu (188,103,36). Ver `DEMO_NIVEL_CLUBE`.
 *
 * ================== ELE E O RAMO "TEM NIVEL" ==================
 *
 * O original so desenha este cartao quando ha nivel; sem nivel, o quarto espaco
 * da grade vira o indicador de `Afiliada`. O dashboard trata os dois ramos —
 * este componente nao precisa saber que o outro existe.
 */
export interface ClubeNivelCardProps {
  nivel: NivelClube;
}

export function ClubeNivelCard({ nivel }: ClubeNivelCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-3xl bg-foreground p-5 text-background shadow-soft md:p-6">
      <Trophy className="size-5" style={{ color: nivel.cor }} aria-hidden />
      <div className="mt-4">
        <p className="mb-1 text-[10px] uppercase tracking-[0.2em] opacity-70">Nível VIP</p>
        {/*
          Caixa alta pelo CSS, e nao pelo texto: o print escreve `BRONZE`, e o
          original escreve isso com `uppercase` sobre `Bronze` vindo do banco.
          Subir a caixa no dado apagaria o nome original do nivel.
        */}
        <p
          className="font-serif text-xl uppercase leading-none md:text-2xl"
          style={{ color: nivel.cor }}
        >
          {nivel.nome}
        </p>
      </div>
    </div>
  );
}
