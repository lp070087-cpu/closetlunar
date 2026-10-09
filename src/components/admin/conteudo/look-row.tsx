'use client';

import { lookPreview } from '@/lib/conteudo/metrics';
import { ListBody, ListMeta, ListRow, ListThumb, ListTitle, MetaDot, RowActions } from './list-row';
import type { Look } from '@/lib/conteudo/types';
import type { Product } from '@/lib/produtos/types';

/**
 * UMA LINHA DA LISTA DE LOOKS — adm-061.
 *
 * ================== ESTE DESENHO NAO ESTA NO PRINT ==================
 *
 * A lista de adm-061 esta VAZIA no material (`Nenhum look cadastrado ainda.`), e por
 * isso NAO HA PRINT de uma linha de look preenchida. O que o material oferece e o
 * cabecalho da secao e o estado vazio — nada mais.
 *
 * Entao esta linha NAO inventa um cartao novo. Ela reusa a MESMA linha do grupo
 * (`ListRow`), que e o desenho comum das outras quatro listas deste modulo, e o unico
 * desenho de linha que o material prova nesta regiao. Criar aqui um cartao de look
 * com foto grande, selo e preco em destaque seria desenhar do nada e depois ter que
 * defender de onde ele veio.
 *
 * O QUE A LINHA MOSTRA, e por que cada campo:
 *
 *   capa        `coverUrl`, quando houver — a mesma miniatura condicional das outras
 *   nome        o unico campo que toda linha de look tem (e o unico obrigatorio do
 *               formulario — ver `validateLook`)
 *   meta        `N peças · Total: R$ … · ativo`, tudo DERIVADO do catalogo pelo mesmo
 *               `lookPreview` do modal, e nao um campo gravado
 *   acoes       `Desativar/Ativar` `Editar` `Excluir`, as tres do grupo
 *
 * O PC. De pecas e o `Total` vem do JOIN com o catalogo — um look sem pecas mostra
 * `0 peças · Total: R$ 0,00`, exatamente como o preview do modal no estado de abertura.
 */
export function LookRow({
  look,
  products,
  onEdit,
  onToggle,
  onDelete,
}: {
  look: Look;
  products: readonly Product[];
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const preview = lookPreview(look.pieces, products);

  return (
    <ListRow>
      {look.coverUrl ? <ListThumb url={look.coverUrl} alt={look.name} maxHeight={72} /> : null}

      <ListBody>
        <ListTitle>{look.name}</ListTitle>
        <ListMeta>
          {preview.pieceCountLabel}
          <MetaDot />
          {preview.totalLabel}
          <MetaDot />
          {look.isActive ? 'ativo' : 'inativo'}
        </ListMeta>
      </ListBody>

      <RowActions
        active={look.isActive}
        entityLabel={look.name}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </ListRow>
  );
}
