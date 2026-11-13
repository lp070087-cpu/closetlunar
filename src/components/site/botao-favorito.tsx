'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { alternarFavorito, idsFavoritos } from '@/lib/cliente/data';

/*
 * Estado compartilhado entre todos os coracoes da pagina: uma unica leitura
 * dos favoritos da conta, e cada clique avisa os outros cartoes.
 */
let cache: Promise<Set<string> | null> | null = null;
const ouvintes = new Set<() => void>();
let atual: Set<string> | null = null;

function carregar() {
  cache ??= idsFavoritos()
    .then((ids) => (atual = ids ? new Set(ids) : null))
    .catch(() => (atual = null));
  return cache;
}

export function BotaoFavorito({ produtoId, nome, className = '' }: { produtoId: string; nome: string; className?: string }) {
  const [, forcar] = useState(0);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    const avisar = () => forcar((n) => n + 1);
    ouvintes.add(avisar);
    void carregar().then(avisar);
    return () => {
      ouvintes.delete(avisar);
    };
  }, []);

  const ativo = !!atual?.has(produtoId);

  async function clicar(e: React.MouseEvent) {
    e.preventDefault();
    if (ocupado) return;
    setOcupado(true);
    try {
      const r = await alternarFavorito(produtoId);
      if (!r) {
        window.location.href = "/entrar";
        return;
      }
      atual ??= new Set();
      if (r.favorito) atual.add(produtoId);
      else atual.delete(produtoId);
      ouvintes.forEach((f) => f());
    } finally {
      setOcupado(false);
    }
  }

  return (
    <button
      type="button"
      onClick={clicar}
      aria-pressed={ativo}
      aria-label={ativo ? `Remover ${nome} dos favoritos` : `Favoritar ${nome}`}
      className={
        'focus-ring grid place-items-center rounded-full bg-background/90 shadow-soft transition-transform hover:scale-110 active:scale-95 ' +
        className
      }
    >
      <Heart
        className={'size-4 transition-colors ' + (ativo ? 'fill-[#C2185B] text-[#C2185B]' : 'text-foreground')}
        aria-hidden
      />
    </button>
  );
}
