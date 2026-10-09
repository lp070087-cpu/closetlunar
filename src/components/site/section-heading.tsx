/**
 * O cabecalho de secao — o `eyebrow` pequeno em caixa alta, o titulo em serifada
 * italica e o subtitulo.
 *
 * E o mesmo bloco em todas as secoes do print: `BEST SELLERS / As Mais Amadas /
 * Peças que conquistaram nossas clientes`. A forma e a do `SectionHeading.tsx` do
 * original, e o `align="left"` e o que as secoes de produto usam (o titulo
 * encosta na esquerda, com as setas do carrossel na mesma linha).
 *
 * O tracinho (`h-px w-16`) so aparece no alinhamento CENTRADO — e o que o print
 * mostra em `Depoimentos` e `Siga-nos no Instagram`. Nas secoes alinhadas a
 * esquerda ele nao existe.
 */
export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  align = 'center',
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  align?: 'center' | 'left';
}) {
  const esquerda = align === 'left';
  return (
    <div className={esquerda ? 'mb-0' : 'mb-10 text-center'}>
      {eyebrow && (
        <div className="mb-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {eyebrow}
        </div>
      )}
      <h2 className="font-serif text-2xl italic md:text-4xl">{title}</h2>
      {subtitle && (
        <p className={'mt-2 text-sm text-muted-foreground ' + (esquerda ? 'max-w-md' : 'mx-auto mt-3 max-w-md')}>
          {subtitle}
        </p>
      )}
      {!esquerda && <div className="mx-auto mt-5 h-px w-16 bg-foreground/30" />}
    </div>
  );
}
