import Image from 'next/image';
import Link from 'next/link';
import fotografias from '@/lib/produtos/fotografias.json';

export const metadata = { title: 'Identificação das fotografias' };

export default function FotografiasPage() {
  return (
    <section className="space-y-6">
      <Link href="/admin/produtos" className="focus-ring inline-block rounded text-sm underline">Voltar para Produtos</Link>
      <div>
        <h1 className="font-serif text-3xl">Fotografias dos produtos</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{fotografias.length} fotos reais disponíveis. Identifique o número da foto e o produto correspondente antes de usá-la no catálogo. Os nomes dos arquivos não identificam os modelos com segurança; nenhuma associação foi presumida.</p>
        <p className="mt-2 text-sm">Correspondências pendentes de confirmação. Preços, nomes, categorias e tamanhos permanecem os existentes.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {fotografias.map(foto => (
          <figure key={foto.id} className="min-w-0 overflow-hidden rounded-xl border border-border bg-background">
            <a href={foto.url} target="_blank" rel="noopener noreferrer" className="focus-ring relative block aspect-[3/4] bg-secondary" aria-label={`Ampliar foto ${foto.id}`}>
              <Image src={foto.url} alt={`Foto ${foto.id}, aguardando identificação do produto`} fill sizes="(max-width: 767px) 45vw, (max-width: 1279px) 30vw, 22vw" className="object-contain" />
            </a>
            <figcaption className="space-y-1 p-3 text-xs">
              <strong className="text-sm">Foto {foto.id}</strong>
              <p className="break-all text-muted-foreground">{foto.original}</p>
              <p>{foto.width} × {foto.height} px · Aguardando confirmação</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
