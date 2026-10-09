import { Instagram } from 'lucide-react';

/**
 * A faixa preta que fecha toda tela da LOJA.
 *
 * ================== O QUE O PRINT MOSTRA, E O QUE ELE NAO MOSTRA ==================
 *
 * Nos prints desta fase aparece SO este bloco: um retangulo escuro, o icone do
 * Instagram, `SIGA-NOS NO INSTAGRAM` e `@closetlunar`. Nada mais. O rodape
 * inteiro da loja (`Footer.tsx` do original) tem ainda newsletter, quatro
 * colunas de links e o copyright — e NENHUM dos 20 prints do cliente mostra
 * qualquer um deles.
 *
 * A leitura ingenua seria "o print so rolou ate aqui". Ela esta errada, e o
 * proprio material prova: `cli-003`, `cli-005` e `cli-007` sao capturas
 * ROLADAS ATE O FIM — a pagina acabou, e o que veio depois do conteudo foi este
 * bloco. Se o rodape completo existisse na area, ele estaria logo abaixo, e nao
 * esta. A area da cliente termina aqui.
 *
 * Por isso este componente NAO reusa o `Footer` da loja: reproduzir o que o
 * print nao tem seria inventar interface. Se o site publico (fase 3) precisar
 * do rodape completo, ele nasce la, com os prints dele.
 *
 * ================== O `@` ==================
 *
 * `@closetlunar`. O print de `cli-003` e `cli-007` escreve exatamente isso. O
 * projeto original deriva o arroba de uma configuracao do banco com fallback
 * `"@closetlunar"` — ou seja, sem banco, o valor E esse. Nao ha divergencia a
 * resolver aqui.
 */
export function StoreFooter() {
  return (
    <footer className="mt-16 bg-foreground py-10 text-center text-background">
      <Instagram className="mx-auto mb-2 size-5" aria-hidden />
      <p className="text-xs uppercase tracking-[0.2em] opacity-70">Siga-nos no Instagram</p>
      <p className="mt-1 font-serif text-2xl">@closetlunar</p>
    </footer>
  );
}
