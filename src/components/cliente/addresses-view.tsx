'use client';

import { useEffect, useState } from 'react';
import { MapPin, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import {
  excluirEndereco,
  listEnderecos,
  marcarEnderecoPrincipal,
  salvarEndereco,
} from '@/lib/cliente/data';
import type { EnderecoCliente } from '@/lib/cliente/types';
import { ClienteToast, type TomAviso } from './cliente-toast';

/**
 * `Endereços` — `/conta/enderecos`, o print `cli-008` (`004726`).
 *
 * ================== O CABECALHO DESTA TELA E PROPRIO ==================
 *
 * Diferente de `Favoritos` e `Meus Pedidos`, aqui o cabecalho NAO usa o
 * `ClientPageHeader`: o print mostra um botao `+ NOVO ENDEREÇO` a direita do
 * titulo, e o original o declara como o PRIMEIRO filho de um `space-y-8`. Duas
 * razoes concretas para nao reusar o componente:
 *
 *   1. **O espaco.** O original poe `space-y-8` no container e deixa o
 *      cabecalho ser um filho normalmente espacado — sem `margin` propria. O
 *      `ClientPageHeader` carrega `mb-6`, que somado ao `space-y-8` daria 56 px
 *      entre o titulo e o que vem abaixo, onde o print mostra 32. Neutralizar o
 *      `mb-6` para reusar seria um workaround, nao uma transcricao.
 *   2. **O corte de largura.** O original empilha titulo/botao em `sm:flex-row`;
 *      o `ClientPageHeader` usa `md:flex-row`. Nao sao o mesmo ponto de virada.
 *
 * Entao o cabecalho e transcrito aqui, com a estrutura do original, e a nota
 * existe para a proxima tela nao achar que foi esquecimento.
 *
 * ================== O FORMULARIO E DO ORIGINAL, NAO DO PRINT ==================
 *
 * O print `cli-008` mostra so o estado VAZIO (o bloco tracejado + a frase). O
 * FORMULARIO nao aparece em print nenhum — mas o botao `+ NOVO ENDEREÇO` so
 * existe para abri-lo, e o original o desenha por extenso. Pela regra de
 * prioridade, o que o original prova se preserva; o que nao se inventa e a
 * APARENCIA que nenhuma fonte mostra. Aqui a aparencia tambem vem do original
 * (os campos, os rotulos, o `X`, os dois botoes), entao o formulario e
 * transcricao. Ver a nota sobre o CEP, abaixo.
 *
 * ================== A CONSULTA DE CEP NAO FAZ REDE NESTA FASE ==================
 *
 * O original, ao digitar 8 digitos no CEP, chama `https://viacep.com.br/…` e
 * preenche rua/bairro/cidade/UF. Nesta fase a area NAO faz rede — e um invariante
 * provado nas bancadas (nenhum `fetch` em `components/cliente`). Alem disso o
 * formulario ainda NAO GRAVA, entao o auto-preenchimento seria cosmetico sobre um
 * salvamento que nao acontece. O campo CEP continua, MANUAL, e a consulta fica
 * registrada como pendencia para a fase do Neon. Inventar um `fetch` agora
 * quebraria a garantia sem entregar nada.
 *
 * ================== SALVAR, EXCLUIR E TORNAR PRINCIPAL NAO GRAVAM — E DIZEM ISSO ==================
 *
 * As tres acoes chamam a camada de dados (`salvarEndereco`, `excluirEndereco`,
 * `marcarEnderecoPrincipal`), que devolve `{ ok: false, reason }` — nao ha banco
 * nesta fase. A tela mostra o `reason` num aviso, e NAO um `Endereço salvo` que
 * mentiria. O formulario NAO fecha ao salvar, porque nada foi salvo. Ver a nota
 * das tres funcoes em `data.ts`.
 *
 * A confirmacao de exclusao. O original usa `confirm("Excluir este endereço?")`,
 * o `window.confirm` do navegador. Aqui a exclusao nao grava, entao uma
 * confirmacao seria um dialogo para uma acao que nao acontece: a acao AVISA que
 * nao ha persistencia, e a pergunta volta quando o banco existir.
 *
 * ================== AS TINTAS `beige` — A MESMA DECISAO DE `Favoritos` ==================
 *
 * O original pinta tres pontos de beige aqui: a caixa vazia (`bg-beige/5`), o
 * circulo do icone (`bg-beige/20`) e o quadrado do cartao (`bg-beige/30`, alem
 * dos `hover:bg-beige/30`). O token `beige` NAO EXISTE no projeto (ver
 * `tailwind.config.ts`: ha `gold`, `rose` e `champagne`), e a tinta real e
 * quase invisivel — 5% de (247,237,226) sobre branco da (255,254,254).
 *
 * O `Favoritos` provou o caso na captura: a caixa leu BRANCO PURO, e nao o
 * beige. Aqui o bloco vazio do original e BYTE-IDENTICO ao de `Favoritos` (so
 * trocam o icone e a frase), entao a amostra valida os dois — amostrar o pixel
 * de novo seria re-medir o que a igualdade do texto ja garante.
 *
 * Conversoes, as mesmas do `Favoritos`: a caixa fica SEM fundo; o circulo usa
 * `bg-secondary/40`; o quadrado do cartao, `bg-secondary/30`; e os
 * `hover:bg-beige/30` viram `hover:bg-secondary/50`, que e o equivalente ja
 * usado no `Favoritos`. Tudo registrado em `PAINEL-CLIENTE-STATUS.md`.
 */

/** O formulario de endereco — `AddressForm` do original. */
export interface EnderecoFormProps {
  initial: EnderecoCliente | null;
  onCancelar: () => void;
  onSalvar: (dados: DadosEndereco) => void;
}

/** Os campos do formulario, todos string — e a forma do `empty` do original. */
export interface DadosEndereco {
  label: string;
  recipient: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

/** O estado inicial do original: `Casa` como etiqueta, o resto vazio. */
export const ENDERECO_VAZIO: DadosEndereco = {
  label: 'Casa',
  recipient: '',
  phone: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

function paraForm(endereco: EnderecoCliente): DadosEndereco {
  return {
    label: endereco.label,
    recipient: endereco.recipient,
    phone: endereco.phone ?? '',
    cep: endereco.cep,
    street: endereco.street,
    number: endereco.number ?? '',
    complement: endereco.complement ?? '',
    neighborhood: endereco.neighborhood ?? '',
    city: endereco.city,
    state: endereco.state,
  };
}

export function EnderecoForm({ initial, onCancelar, onSalvar }: EnderecoFormProps) {
  const [f, setF] = useState<DadosEndereco>(initial ? paraForm(initial) : ENDERECO_VAZIO);

  function on<K extends keyof DadosEndereco>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSalvar(f);
      }}
      className="relative mb-8 grid gap-4 rounded-3xl border border-border bg-background p-6 shadow-elegant motion-safe:animate-fade-up sm:grid-cols-2 md:gap-6 md:p-8"
    >
      <button
        type="button"
        onClick={onCancelar}
        className="absolute right-4 top-4 rounded-xl p-2 transition-colors hover:bg-secondary/50"
        aria-label="Fechar"
      >
        <X className="size-5" aria-hidden />
      </button>

      <div className="sm:col-span-2">
        {/* O titulo troca pelo que esta sendo editado — `initial.recipient` do original. */}
        <h3 className="mb-2 font-serif text-xl">
          {initial ? 'Editar Endereço' : 'Novo Endereço'}
        </h3>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Preencha os campos abaixo para entrega
        </p>
      </div>

      <Campo label="Identificação (ex: Casa, Trabalho)" value={f.label} onChange={(v) => on('label', v)} />
      <Campo label="Destinatário (Nome Completo)" required value={f.recipient} onChange={(v) => on('recipient', v)} />
      <Campo label="WhatsApp" value={f.phone} onChange={(v) => on('phone', v)} placeholder="(00) 00000-0000" />
      <Campo label="CEP" required value={f.cep} onChange={(v) => on('cep', v)} placeholder="00000-000" />
      <Campo label="Rua / Avenida" required value={f.street} onChange={(v) => on('street', v)} />

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Número" value={f.number} onChange={(v) => on('number', v)} />
        <Campo label="Complemento" value={f.complement} onChange={(v) => on('complement', v)} />
      </div>

      <Campo label="Bairro" value={f.neighborhood} onChange={(v) => on('neighborhood', v)} />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Campo label="Cidade" required value={f.city} onChange={(v) => on('city', v)} />
        </div>
        {/* A UF e forçada a duas letras em caixa alta — `.toUpperCase().slice(0, 2)` do original. */}
        <Campo label="Estado" required value={f.state} onChange={(v) => on('state', v.toUpperCase().slice(0, 2))} />
      </div>

      <div className="flex flex-col justify-end gap-3 pt-4 md:flex-row sm:col-span-2">
        <button
          type="button"
          onClick={onCancelar}
          className="h-12 rounded-xl border border-border px-8 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-secondary/50"
        >
          Cancelar
        </button>
        <button className="h-12 rounded-xl bg-foreground px-8 text-[10px] font-bold uppercase tracking-widest text-background shadow-md transition-all hover:opacity-90">
          Salvar Endereço
        </button>
      </div>
    </form>
  );
}

/** O `Input` do original: rotulo em caixa alta + campo de 48 px. */
function Campo({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      <input
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm transition-all"
      />
    </label>
  );
}

export function AddressesView() {
  const [enderecos, setEnderecos] = useState<EnderecoCliente[] | null>(null);
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<EnderecoCliente | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; tom: TomAviso } | null>(null);

  useEffect(() => {
    let ativo = true;
    void listEnderecos().then(({ data }) => {
      if (ativo) setEnderecos(data);
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (!enderecos) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  /**
   * Toda escrita desta fase devolve o motivo, e a tela o mostra. Um sucesso
   * falso seria a unica mentira possivel aqui.
   */
  async function tentar(acao: () => Promise<{ ok: boolean; reason?: string }>, sucesso: string) {
    const { ok, reason } = await acao();
    setAviso(
      ok
        ? { texto: sucesso, tom: 'sucesso' }
        : { texto: reason ?? 'Ainda não foi possível salvar.', tom: 'erro' },
    );
  }

  return (
    <div className="space-y-8">
      <ClienteToast message={aviso?.texto ?? null} tom={aviso?.tom ?? 'sucesso'} />

      {/* O cabecalho proprio desta tela — ver a nota do topo. */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="font-serif text-3xl">Endereços</h2>
        <button
          type="button"
          onClick={() => {
            setEditando(null);
            setCriando(true);
          }}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-8 text-xs font-bold uppercase tracking-widest text-background shadow-md transition-all hover:opacity-90 sm:w-auto"
        >
          <Plus className="size-4" aria-hidden /> Novo endereço
        </button>
      </div>

      {(criando || editando) && (
        <div className="motion-safe:animate-scale-in">
          <EnderecoForm
            initial={editando}
            onCancelar={() => {
              setEditando(null);
              setCriando(false);
            }}
            onSalvar={() => {
              void tentar(salvarEndereco, 'Endereço salvo');
            }}
          />
        </div>
      )}

      {enderecos.length === 0 && !criando && (
        <div className="rounded-[2rem] border border-dashed border-border p-16 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-secondary/40">
            <MapPin className="size-8 text-muted-foreground/40" aria-hidden />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Você ainda não possui endereços cadastrados.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {enderecos.map((a) => (
          <div
            key={a.id}
            className={`group rounded-3xl border p-6 shadow-sm transition-all md:p-8 ${
              a.is_default
                ? 'border-foreground/20 bg-background ring-1 ring-foreground/10'
                : 'border-border bg-background hover:border-foreground/20'
            }`}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-secondary/30 text-muted-foreground">
                  <MapPin className="size-4" aria-hidden />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {a.label}
                </span>
              </div>
              {a.is_default && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-background">
                  <Star className="size-3 fill-current" aria-hidden /> Principal
                </span>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-lg font-bold tracking-tight">{a.recipient}</p>
              {/*
                A linha do logradouro, na forma do original: rua + `, numero`
                (so se houver) + ` · complemento` (so se houver). Nada de virgula
                solta quando falta o numero.
              */}
              <p className="text-sm leading-relaxed text-muted-foreground">
                {a.street}
                {a.number ? `, ${a.number}` : ''}
                {a.complement ? ` · ${a.complement}` : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                {a.neighborhood ? `${a.neighborhood} · ` : ''}
                {a.city}/{a.state} · <span className="font-mono text-[13px]">{a.cep}</span>
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2 border-t border-border/50 pt-6">
              {!a.is_default && (
                <button
                  type="button"
                  onClick={() => void tentar(marcarEnderecoPrincipal, 'Endereço principal atualizado')}
                  className="h-10 rounded-xl border border-border px-4 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-secondary/50"
                >
                  Tornar principal
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditando(a);
                  setCriando(false);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-secondary/50"
              >
                <Pencil className="size-3.5" aria-hidden /> Editar
              </button>
              {/*
                `text-rose-600` do original vira `text-danger` — a mesma conversao
                ja usada no desconto de `PedidoCard` e no remover de `Favoritos`.
              */}
              <button
                type="button"
                onClick={() => void tentar(excluirEndereco, 'Removido')}
                className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-[10px] font-bold uppercase tracking-widest text-danger transition-colors hover:bg-danger-surface"
              >
                <Trash2 className="size-3.5" aria-hidden /> Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
