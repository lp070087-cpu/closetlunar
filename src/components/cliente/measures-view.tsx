'use client';

import { useEffect, useState } from 'react';
import { Ruler, Sparkles } from 'lucide-react';
import {
  getPerfilMedidas,
  listHistoricoMedidas,
  salvarPerfilMedidas,
} from '@/lib/cliente/data';
import { dataCurta } from '@/lib/cliente/metrics';
import type { MedidaHistorico, PerfilMedidas } from '@/lib/cliente/types';
import { ClienteToast, type TomAviso } from './cliente-toast';

/**
 * `Minhas Medidas` — `/conta/medidas`, os prints `cli-010` (`004742`) e `cli-011`
 * (`004753`).
 *
 * ================== O CABECALHO DESTA TELA TAMBEM E PROPRIO ==================
 *
 * Aqui o cabecalho NAO usa o `ClientPageHeader`, pelo MESMO motivo de
 * `Endereços`: o original o declara como o primeiro filho de um `space-y-8`, sem
 * margem propria, e o componente compartilhado carrega `mb-6`. Reusar somaria os
 * doze pixels do componente ao espaco do container. A diferenca com `Endereços`
 * esta no conteudo: aqui o cabecalho tem DUAS linhas de texto (titulo +
 * descricao) e o botao `VER NO AVATAR 3D` a direita; o corte de largura continua
 * sendo `md:flex-row`, como o original.
 *
 * ================== A DESCRICAO TEM UM TRECHO DE DESTAQUE ==================
 *
 * `Mantenha seu perfil atualizado para recomendações precisas no Provador
 * Virtual.` — e `Provador Virtual` vai em `text-foreground font-medium`, o resto
 * em `text-muted-foreground`. E por isso que a descricao NAO e uma prop de texto
 * puro do `ClientPageHeader`: ela e meia-frase com estilo proprio. O print
 * `004742` mostra exatamente o contraste.
 *
 * ================== `VER NO AVATAR 3D` E ALVO, E NAO FLUXO ==================
 *
 * O original liga este botao a `openFitting()` do `FittingRoomContext` — que e um
 * componente do SITE (`@/components/site/...`), e nao desta area. E a mesma
 * situacao dos botoes de carrinho de `Favoritos` e dos dois de rastreio de
 * `Meus Pedidos`: a acao depende de algo que esta fora desta fase. Entao o botao
 * e um ALVO, sem `onClick` — recriar um Provador local seria a segunda
 * implementacao do mesmo conceito (proibido na Fase 4). O desenho e transcrito; a
 * ligacao entra quando o site existir.
 *
 * ================== O FORMULARIO NAO GRAVA — E DIZ ISSO ==================
 *
 * O `SALVAR PERFIL DE MEDIDAS` chama `salvarPerfilMedidas()`, que devolve
 * `{ ok: false, reason }`. A tela mostra o `reason` num aviso, e NAO um `Medidas
 * salvas` que mentiria. O original grava DUAS vezes (perfil + historico) — ver a
 * nota de `salvarPerfilMedidas` em `data.ts`.
 *
 * ================== AS TINTAS `beige` — A TERCEIRA VEZ ==================
 *
 * O original pinta os campos com `bg-beige/10`, o bloco vazio do historico com
 * `bg-beige/5`, o `thead` da tabela com `bg-beige/20` e as linhas com
 * `hover:bg-beige/10`. O token `beige` nao existe neste projeto e a tinta e
 * quase invisivel — a decisao e a mesma de `Favoritos` e `Endereços`: a FORMA se
 * transcreve, a tinta nao se inventa. Os campos e o cabecalho da tabela usam a
 * familia `secondary`; o bloco vazio fica SEM fundo (o material mostra branco
 * puro). Ver `PAINEL-CLIENTE-STATUS.md`.
 *
 * ================== A ESTRELINHA VIP E `amber-600`, E NAO `amber-500` ==================
 *
 * O original escreve `<Sparkles className="h-4 w-4 text-amber-500" />`. Aqui e
 * `text-amber-600`, e a troca e deliberada: a bancada do Dashboard MEDIU o
 * amarelo do cartao de KPI no print e achou `amber-600` — a mediana foi
 * (228,124,20), que e o `--amber-600` do Tailwind. A estrela do VIP e do MESMO
 * amarelo; usar dois amber na area da cliente (600 no KPI, 500 aqui) criaria uma
 * diferenca de tom que nenhum print mostra. Entao a area usa UM amber, o medido,
 * e a divergencia fica registrada — o mesmo criterio de nao inventar segunda
 * tinta para o mesmo papel que o `ClienteToast` ja aplicou ao verde.
 */

/** As seis medidas numericas, na ordem do original. */
export type MedidaCampo = 'height' | 'weight' | 'age' | 'bust' | 'waist' | 'hip';

export const FIELDS: Array<{ key: MedidaCampo; label: string; unit: string }> = [
  { key: 'height', label: 'Altura', unit: 'cm' },
  { key: 'weight', label: 'Peso', unit: 'kg' },
  { key: 'age', label: 'Idade', unit: 'anos' },
  { key: 'bust', label: 'Busto', unit: 'cm' },
  { key: 'waist', label: 'Cintura', unit: 'cm' },
  { key: 'hip', label: 'Quadril', unit: 'cm' },
];

/** As opcoes de tamanho de costume — a lista do original. */
export const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XG'];

type FormMedidas = Record<MedidaCampo, string>;

const FORM_VAZIO: FormMedidas = { height: '', weight: '', age: '', bust: '', waist: '', hip: '' };

/** O perfil do banco (numeros) para o formulario (strings) — o `useEffect` do original. */
function perfilParaForm(perfil: PerfilMedidas | null): FormMedidas {
  if (!perfil) return { ...FORM_VAZIO };
  const campo = (v: number | null) => (v == null ? '' : String(v));
  return {
    height: campo(perfil.height),
    weight: campo(perfil.weight),
    age: campo(perfil.age),
    bust: campo(perfil.bust),
    waist: campo(perfil.waist),
    hip: campo(perfil.hip),
  };
}

export function MeasuresView() {
  const [perfil, setPerfil] = useState<PerfilMedidas | null | undefined>(undefined);
  const [historico, setHistorico] = useState<MedidaHistorico[] | null>(null);
  const [form, setForm] = useState<FormMedidas>({ ...FORM_VAZIO });
  const [usualSize, setUsualSize] = useState('');
  const [fit, setFit] = useState('normal');
  const [praticaAtividade, setPraticaAtividade] = useState<boolean | null>(null);
  const [tempoAtividade, setTempoAtividade] = useState('');
  const [sabeMedidas, setSabeMedidas] = useState<boolean | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; tom: TomAviso } | null>(null);

  useEffect(() => {
    let ativo = true;
    void getPerfilMedidas().then(({ data }) => {
      if (!ativo) return;
      setPerfil(data);
      // O `useEffect` do original: o perfil preenche o formulario quando chega.
      setForm(perfilParaForm(data));
      setUsualSize(data?.usual_size ?? '');
      setFit(data?.fit_preference ?? 'normal');
      setPraticaAtividade(data?.practices_activity ?? null);
      setTempoAtividade(data?.activity_time ?? '');
      setSabeMedidas(data?.knows_measurements ?? null);
    });
    void listHistoricoMedidas().then(({ data }) => {
      if (ativo) setHistorico(data);
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (perfil === undefined || historico === null) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  async function tentarSalvar() {
    // A validacao do original: altura, peso e idade sao obrigatorios.
    if (!form.height || !form.weight || !form.age) {
      setAviso({ texto: 'Altura, peso e idade são obrigatórios.', tom: 'erro' });
      return;
    }
    const { ok, reason } = await salvarPerfilMedidas();
    setAviso(
      ok
        ? { texto: 'Medidas salvas', tom: 'sucesso' }
        : { texto: reason ?? 'Ainda não foi possível salvar.', tom: 'erro' },
    );
  }

  const atualizadoEm = dataCurta(perfil?.updated_at ?? null);

  return (
    <div className="space-y-8 motion-safe:animate-fade-up">
      <ClienteToast message={aviso?.texto ?? null} tom={aviso?.tom ?? 'sucesso'} />

      {/* O cabecalho proprio desta tela — ver a nota do topo. */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-serif text-3xl">Minhas Medidas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mantenha seu perfil atualizado para recomendações precisas no{' '}
            <span className="font-medium text-foreground">Provador Virtual</span>.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-8 text-[10px] font-bold uppercase tracking-[0.15em] text-background shadow-md transition-all hover:opacity-90 active:scale-95"
        >
          <Sparkles className="size-4" aria-hidden /> Ver no Avatar 3D
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ============ A COLUNA DO FORMULARIO ============ */}
        <div className="lg:col-span-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void tentarSalvar();
            }}
            className="space-y-8 rounded-[2rem] border border-border bg-background p-6 shadow-elegant md:p-10"
          >
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {FIELDS.map((f) => (
                <label key={f.key} className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    {f.label} ({f.unit})
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={form[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="mt-1.5 h-12 w-full rounded-xl border border-border bg-secondary/30 px-4 text-sm font-medium transition-all focus:bg-background focus:ring-2 focus:ring-foreground/5"
                  />
                </label>
              ))}
            </div>

            <div className="grid gap-6 border-t border-border/50 pt-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Tamanho de costume
                </span>
                <select
                  value={usualSize}
                  onChange={(e) => setUsualSize(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-secondary/30 px-4 text-sm font-medium transition-all focus:bg-background"
                >
                  <option value="">Selecione —</option>
                  {TAMANHOS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Preferência de caimento
                </span>
                <select
                  value={fit}
                  onChange={(e) => setFit(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-secondary/30 px-4 text-sm font-medium transition-all focus:bg-background"
                >
                  <option value="justo">Mais justo ao corpo</option>
                  <option value="normal">Caimento padrão (Normal)</option>
                  <option value="folgado">Mais folgado/confortável</option>
                </select>
              </label>
            </div>

            <div className="space-y-5 border-t border-border/50 pt-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Você pratica atividade física?
                </span>
                <div className="flex gap-2">
                  <BotaoSimNao
                    ativo={praticaAtividade === true}
                    onClick={() => setPraticaAtividade(true)}
                  >
                    Sim
                  </BotaoSimNao>
                  <BotaoSimNao
                    ativo={praticaAtividade === false}
                    // O original limpa o tempo quando a resposta vira `Não`.
                    onClick={() => {
                      setPraticaAtividade(false);
                      setTempoAtividade('');
                    }}
                  >
                    Não
                  </BotaoSimNao>
                </div>
              </div>
              {praticaAtividade === true && (
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Há quanto tempo?
                  </span>
                  <input
                    type="text"
                    value={tempoAtividade}
                    onChange={(e) => setTempoAtividade(e.target.value)}
                    placeholder="Ex: 6 meses, 2 anos"
                    className="mt-1.5 h-12 w-full rounded-xl border border-border bg-secondary/30 px-4 text-sm font-medium transition-all focus:bg-background"
                  />
                </label>
              )}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Sabe informar suas medidas?{' '}
                  <span className="font-normal normal-case tracking-normal text-muted-foreground/70">
                    (busto, cintura, quadril)
                  </span>
                </span>
                <div className="flex gap-2">
                  <BotaoSimNao
                    ativo={sabeMedidas === true}
                    onClick={() => setSabeMedidas(true)}
                  >
                    Sim
                  </BotaoSimNao>
                  <BotaoSimNao
                    ativo={sabeMedidas === false}
                    onClick={() => setSabeMedidas(false)}
                  >
                    Não
                  </BotaoSimNao>
                </div>
              </div>
            </div>

            <button className="h-12 w-full rounded-xl bg-foreground px-10 text-[10px] font-bold uppercase tracking-[0.2em] text-background shadow-lg transition-all hover:opacity-90 active:scale-95 md:w-auto">
              Salvar Perfil de Medidas
            </button>
          </form>
        </div>

        {/* ============ A COLUNA LATERAL ============ */}
        <div className="space-y-6">
          {/*
            O cartao ESCURO. O `Ruler` grande e uma MARCA D'AGUA (opacity-10,
            rotacionada), e o `group-hover` a endireita. O numero e
            `Tamanho {usual_size}` quando ha tamanho, e `Aguardando dados`
            quando nao — o ramo que o print mostra.
          */}
          <div className="group relative overflow-hidden rounded-3xl border border-border bg-foreground p-6 text-background shadow-soft">
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] opacity-70">
                <Ruler className="size-4" aria-hidden /> Última recomendação
              </div>
              <p className="font-serif text-3xl md:text-4xl">
                {perfil?.usual_size ? `Tamanho ${perfil.usual_size}` : 'Aguardando dados'}
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-widest opacity-60">
                {atualizadoEm ? `Atualizado em ${atualizadoEm}` : 'Complete seu perfil'}
              </p>
            </div>
            <Ruler className="absolute -bottom-4 -right-4 size-32 rotate-12 opacity-10 transition-transform duration-700 group-hover:rotate-0" aria-hidden />
          </div>

          <div className="rounded-3xl border border-border bg-background p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              <Sparkles className="size-4 text-amber-600" aria-hidden /> Vantagens VIP
            </div>
            <h4 className="mb-2 font-serif text-xl">Sua Closet, Seu Tamanho</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Com as medidas salvas, nosso sistema identifica automaticamente quais peças ficarão
              perfeitas em você, evitando trocas e devoluções.
            </p>
          </div>
        </div>
      </div>

      {/* ============ O HISTORICO ============ */}
      <div className="space-y-6 pt-6">
        <h3 className="font-serif text-2xl">Histórico de Medidas</h3>
        {historico.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum registro anterior encontrado.</p>
          </div>
        ) : (
          <div className="overflow-hidden overflow-x-auto rounded-[2rem] border border-border bg-background shadow-sm">
            <table className="w-full min-w-[600px] text-left text-sm">
              {/*
                O `thead` usa a familia `secondary` no lugar do `bg-beige/20` do
                original — ver a nota das tintas no topo.
              */}
              <thead className="border-b border-border bg-secondary/40">
                <tr>
                  <Th>Data</Th>
                  <Th centro>Peso</Th>
                  <Th centro>Busto</Th>
                  <Th centro>Cintura</Th>
                  <Th centro>Quadril</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {historico.map((h) => (
                  <tr key={h.id} className="transition-colors hover:bg-secondary/20">
                    <td className="px-6 py-4 font-medium text-muted-foreground">
                      {dataCurta(h.created_at)}
                    </td>
                    <CelulaValor valor={h.weight} unidade="kg" />
                    <CelulaValor valor={h.bust} unidade="cm" />
                    <CelulaValor valor={h.waist} unidade="cm" />
                    <CelulaValor valor={h.hip} unidade="cm" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/** O botao sim/nao — a pilula que acende quando escolhida. */
export function BotaoSimNao({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 flex-1 rounded-xl border text-sm font-medium transition-all ${
        ativo
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-secondary/30 hover:border-foreground/40'
      }`}
    >
      {children}
    </button>
  );
}

/** O cabecalho da tabela do historico. */
function Th({ children, centro }: { children: React.ReactNode; centro?: boolean }) {
  return (
    <th
      className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ${
        centro ? 'text-center' : ''
      }`}
    >
      {children}
    </th>
  );
}

/**
 * Uma celula de valor do historico — `59 kg`, `90 cm`.
 *
 * O `null` vira VAZIO, e nao `0`: o trimestre do print mostra o numero em
 * serifada grande com a unidade em caixa alta pequena ao lado. Os campos que a
 * conta dos prints nao informou (`bust`, `waist`, `hip`) sao `null`, e escrever
 * `0 cm` seria pior que nao escrever nada — e uma medida que ninguem tirou.
 */
export function CelulaValor({ valor, unidade }: { valor: number | null; unidade: string }) {
  return (
    <td className="px-6 py-4 text-center font-serif text-lg">
      {valor == null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <>
          {valor}{' '}
          <span className="font-sans text-[10px] uppercase text-muted-foreground">{unidade}</span>
        </>
      )}
    </td>
  );
}
