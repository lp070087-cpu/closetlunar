import { cn } from '@/lib/utils';

/**
 * O titulo do PAINEL DE CONTEUDO de uma tela da area da cliente.
 *
 * ================== ELE NAO E O CABECALHO DO ADMIN ==================
 *
 * O admin tem um cabecalho rico (rotulo em caixa alta, titulo, faixa de abas,
 * acoes a direita). Nada disso aparece nos prints do cliente: aqui o titulo
 * serifado nasce DENTRO do painel branco, alinhado com o conteudo — e essa e a
 * unica diferenca estrutural entre as duas areas.
 *
 * A medida tambem e outra: o print `cli-019` mostra `Segurança` com 19 px de
 * altura de maiuscula, e esse e o `text-3xl` do original. O titulo equivalente
 * no admin e menor.
 *
 * ================== A LINHA DE APOIO E OPCIONAL, E ISSO IMPORTA ==================
 *
 * `Dados da Conta` tem uma (`Gerencie suas informações pessoais de contato e
 * acesso.`, em `cli-017`); `Meus Pedidos` e `Favoritos` NAO tem. Manter o campo
 * opcional em vez de exigir uma descricao para toda tela e o que impede a
 * "descricao padrao" que aparece em todas e nao informa nada. Quem passa,
 * passa porque o print passa.
 *
 * ================== O ESPACO ABAIXO E DO CABECALHO, MAS ACEITA AJUSTE ==================
 *
 * O original escreve o `<h2>` solto em quase toda tela: o espaco entre titulo e
 * conteudo e o que o arranjo de cada pagina ja da. `conta.favoritos.tsx` e a
 * excecao — o unico `<h2>` que declara margem propria (`mb-8`). Como o espaco
 * padrao e do cabecalho, essa tela cresce por `className` em vez de somar um
 * `mb-8` externo (o que daria dois espacos onde o print mostra um). Por isso o
 * campo existe, e nao por gosto: e o ajuste de UMA tela que a referencia prova.
 */
export interface ClientPageHeaderProps {
  titulo: string;
  /** A linha de apoio. So onde o print mostra. */
  descricao?: string;
  /** Ajuste de espaco de UMA tela (ex.: o `mb-8` de `Favoritos`). */
  className?: string;
  /** Acoes a direita (ex.: `+ NOVO ENDEREÇO`). */
  children?: React.ReactNode;
}

export function ClientPageHeader({ titulo, descricao, className, children }: ClientPageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between', className)}>
      <div className="min-w-0">
        <h2 className="font-serif text-3xl">{titulo}</h2>
        {descricao ? <p className="mt-1 text-sm text-muted-foreground">{descricao}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 flex-wrap gap-3">{children}</div> : null}
    </div>
  );
}
