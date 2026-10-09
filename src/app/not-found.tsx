import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="max-w-md text-center">
        <p className="eyebrow-caps">Erro 404</p>
        <h1 className="mt-3 font-serif text-4xl">Página não encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O endereço acessado não existe ou foi movido.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/admin">Ir para o painel</ButtonLink>
          <ButtonLink href="/" variant="outline">
            Ir para a loja
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
