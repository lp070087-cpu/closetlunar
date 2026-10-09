'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, FieldGrid, Input } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { parsePrice, priceLabel } from '@/lib/configuracoes/metrics';
import type { DeliveryZone, ZoneDraft } from '@/lib/configuracoes/types';

const PRAZO_PADRAO = 'Mesmo dia / 24h';

export function draftFromZone(zona: DeliveryZone): ZoneDraft {
  return {
    id: zona.id,
    state: zona.state,
    city: zona.city,
    neighborhood: zona.neighborhood,
    price: priceLabel(zona.price),
    etaLabel: zona.etaLabel,
    isActive: zona.isActive,
  };
}

/** Um rascunho novo, já com a cidade do bloco (quando o botão veio de um bloco). */
export function draftNewCity(city = '', state = ''): ZoneDraft {
  return {
    id: null,
    state,
    city,
    neighborhood: '',
    price: '0,00',
    etaLabel: PRAZO_PADRAO,
    isActive: true,
  };
}

/**
 * ================== ESTE FORMULÁRIO VEM DO ORIGINAL, NÃO DE UM PRINT ==================
 *
 * Nenhuma das nove capturas de Configurações abre `+ Adicionar cidade`,
 * `+ Adicionar bairro` ou `Editar` — os três botões aparecem, o formulário por
 * trás deles nunca. Reconstruí-lo a partir de `LocalZoneForm` do projeto original
 * é o mais longe que a evidência permite ir; daí os campos serem exatamente os
 * que o original tem (UF, cidade, bairro, valor, prazo, ativo) e nada além.
 *
 * O `prazo` no original é um par de números (`daysMin`/`daysMax`); o print escreve
 * o texto já pronto (`Mesmo dia / 24h`), então aqui o campo é o TEXTO, que é o que
 * a coluna `Prazo` da tabela mostra. Virar dois campos numéricos seria inventar
 * uma tela de entrada que o print não tem.
 */
export function ZoneForm({
  draft,
  open,
  saving,
  onClose,
  onSave,
}: {
  draft: ZoneDraft | null;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: ZoneDraft) => void;
}) {
  const [local, setLocal] = useState<ZoneDraft | null>(draft);

  useEffect(() => {
    setLocal(draft);
  }, [draft]);

  if (!local) return null;

  const edicao = local.id !== null;
  const preco = parsePrice(local.price);
  const valido =
    local.state.trim().length === 2 && local.city.trim() !== '' && preco !== null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={edicao ? 'Editar bairro' : 'Adicionar cidade / bairro'}
      description="O checkout casa o endereço do cliente por cidade e bairro."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={!valido || saving}
            onClick={() => {
              if (valido) onSave(local);
            }}
          >
            {saving ? 'Salvando…' : edicao ? 'Salvar bairro' : 'Adicionar'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <FieldGrid columns={2}>
          <Field label="UF" hint="Duas letras maiúsculas.">
            <Input
              value={local.state}
              maxLength={2}
              onChange={(event) =>
                setLocal({ ...local, state: event.target.value.toUpperCase() })
              }
              placeholder="PE"
            />
          </Field>
          <Field label="Cidade">
            <Input
              value={local.city}
              onChange={(event) => setLocal({ ...local, city: event.target.value })}
              placeholder="Recife"
            />
          </Field>
        </FieldGrid>

        <Field
          label="Bairro"
          hint="Em branco significa atender a cidade inteira — a tabela escreve “toda a cidade”."
        >
          <Input
            value={local.neighborhood}
            onChange={(event) => setLocal({ ...local, neighborhood: event.target.value })}
            placeholder="Boa Viagem"
          />
        </Field>

        <FieldGrid columns={2}>
          <Field label="Valor" hint="Em reais. Aceita 25, 25,50 e 25.50.">
            <Input
              inputMode="decimal"
              value={local.price}
              onChange={(event) => setLocal({ ...local, price: event.target.value })}
              placeholder="25,00"
            />
          </Field>
          <Field label="Prazo">
            <Input
              value={local.etaLabel}
              onChange={(event) => setLocal({ ...local, etaLabel: event.target.value })}
              placeholder={PRAZO_PADRAO}
            />
          </Field>
        </FieldGrid>

        <Checkbox
          checked={local.isActive}
          onChange={(event) => setLocal({ ...local, isActive: event.target.checked })}
          label="Ativo no checkout"
        />
      </div>
    </Modal>
  );
}
