import { DashboardView } from '@/components/cliente/dashboard-view';

/**
 * `/conta` — o Dashboard.
 *
 * Server Component, e por isso a pagina NAO tem `'use client'`: ela so existe
 * para entregar a view. Toda a leitura acontece la, porque o resumo depende do
 * relogio do NAVEGADOR — e o servidor nao deve decidir quais cupons estao
 * ativos com base no fuso em que ele roda.
 *
 * O titulo da tela nao esta aqui: no dashboard nao ha `ClientPageHeader`. O
 * print `cli-001` vai direto da saudacao (`Ola, ...`, que e da CASCA) para os
 * indicadores — nao ha titulo de painel nessa tela. As outras oito telas tem.
 */
export default function ContaDashboardPage() {
  return <DashboardView />;
}
