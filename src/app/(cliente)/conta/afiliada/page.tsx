import { AfiliadaView } from '@/components/cliente/afiliada-view';

/**
 * `/conta/afiliada` — o destino do atalho `Afiliada` do dashboard.
 *
 * A rota NAO e um item da coluna de navegacao: o print `cli-001` mostra
 * `Afiliada` como um dos oito cartoes de atalho do corpo do dashboard, e a
 * sidebar do `cli-019` nao a tem. Ver a nota de `CONTA_ATALHOS` em `nav.ts`.
 *
 * A pagina nao passa prop nenhuma. A `AfiliadaView` le o perfil num efeito — e
 * a origem do link de divulgacao fica vazia ate o site publico existir (Fase 3),
 * porque a demonstracao nao tem dominio que possa afirmar.
 */
export default function ContaAfiliadaPage() {
  return <AfiliadaView />;
}
