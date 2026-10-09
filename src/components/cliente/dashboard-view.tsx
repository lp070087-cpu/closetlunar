'use client';

import { useEffect, useState } from 'react';
import { Package, Trophy, Users, Wallet } from 'lucide-react';
import { getResumo } from '@/lib/cliente/data';
import { CONTA_ATALHOS } from '@/lib/cliente/nav';
import { formatBRL } from '@/lib/utils';
import type { ResumoCliente } from '@/lib/cliente/types';
import { AccountQuickLink } from './account-quick-link';
import { ClubeNivelCard } from './clube-nivel-card';
import { CuponsAtivosCard } from './cupons-ativos-card';
import { Stat } from '@/components/ui/stat';
import { UltimoPedidoCard } from './ultimo-pedido-card';

/**
 * O Dashboard de `/conta` — a tela que o print `cli-001` mostra.
 *
 * ================== A ESTRUTURA, NA ORDEM DO PRINT ==================
 *
 * 1. tres indicadores + o cartao de nivel VIP, numa grade de 4;
 * 2. os oito atalhos, numa grade de 4;
 * 3. `Ultimo pedido` e `Cupons ativos`, lado a lado.
 *
 * Nada aqui foi escolhido: e a ordem do `conta.index.tsx`, e a mesma que os
 * prints mostram ao rolar.
 *
 * ================== NAO HA RELOGIO NESTA TELA ==================
 *
 * O efeito chama `getResumo()` sem data: o cartao `Cupons ativos` lista o que
 * esta `is_active`, e nao o que esta dentro da validade. Quem mede validade e
 * `/conta/cupons`, no modulo dela.
 *
 * ================== O QUE A TELA MOSTRA ANTES DE LER ==================
 *
 * `renderToStaticMarkup` nao roda efeito: no primeiro desenho o resumo ainda e
 * `null`, e a tela mostra `Carregando...`. Isso e proposital — abrir com zeros
 * afirmaria `0 pedidos` antes de ter lido, e uma cliente com pedidos veria a
 * tela piscar o numero errado.
 *
 * ================== O NIVEL, E A UNICA COISA DESENHADA ANTES DE LER ==================
 *
 * O cartao escuro de nivel NAO depende do resumo: ele e um cartao de APRESENTACAO
 * do clube, e o print o mostra preenchido. Entao ele e o unico bloco que existe
 * nos dois estados, e por isso a tela de carregamento nao e uma tarja cinza —
 * ela e o mesmo grid com os tres indicadores ainda vazios.
 *
 * O nivel vem de `resumo.nivel`, que `data.ts` ja calculou. A tela NAO recalcula:
 * chamar `nivelAtual` de novo aqui seria uma segunda conta para o mesmo numero, e
 * no dia em que a regra do nivel mudasse as duas poderiam discordar.
 */
export function DashboardView() {
  const [resumo, setResumo] = useState<ResumoCliente | null>(null);

  useEffect(() => {
    let ativo = true;
    void getResumo().then(({ data }) => {
      if (ativo) setResumo(data);
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (!resumo) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-8">
      {/* 1. Indicadores + nivel VIP */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Package} label="Pedidos" value={String(resumo.pedidos)} />
        <Stat icon={Wallet} label="Cashback" value={formatBRL(resumo.cashback)} corIcone="text-accent" />
        <Stat
          icon={Trophy}
          label="Meus Pontos"
          value={String(resumo.pontos)}
          corIcone="text-amber-600"
        />
        {resumo.nivel ? (
          <ClubeNivelCard nivel={resumo.nivel} />
        ) : (
          <ClubeNivelAusente />
        )}
      </div>

      {/* 2. Os oito atalhos */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 md:grid-cols-4">
        {CONTA_ATALHOS.map((atalho) => (
          <AccountQuickLink
            key={atalho.href}
            href={atalho.href}
            icon={atalho.icon}
            label={atalho.label}
            count={atalho.href === '/conta/favoritos' ? resumo.favoritos : undefined}
            mostraContagem={atalho.mostraContagem}
          />
        ))}
      </div>

      {/* 3. Ultimo pedido + cupons */}
      <div className="grid gap-6 pt-4 lg:grid-cols-2">
        <UltimoPedidoCard pedido={resumo.ultimoPedido} />
        <CuponsAtivosCard cupons={resumo.cuponsAtivos} />
      </div>
    </div>
  );
}

/**
 * O quarto espaco da grade quando NAO ha nivel cadastrado.
 *
 * O original troca o cartao escuro por um indicador de `Afiliada` com o valor
 * `Painel` — e o unico ramo do arquivo dele em que `Afiliada` aparece num
 * cartao de indicador, e nao num atalho. Nao ha print deste estado (o material
 * mostra o ramo COM nivel), e por isso ele existe apenas como fallback: com o
 * nivel presente, este componente nao e desenhado.
 *
 * Escrever aqui um cartao escuro com `--` seria inventar uma aparencia para um
 * estado que nenhuma fonte mostra. O indicador neutro reaproveita um componente
 * que a tela ja usa, e nao cria um novo.
 */
function ClubeNivelAusente() {
  return (
    <Stat
      icon={Users}
      label="Afiliada"
      value="Painel"
      corIcone="text-muted-foreground"
      className="justify-between"
    />
  );
}
