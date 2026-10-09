import type { Metadata } from 'next';
import { AffiliatesView } from '@/components/admin/afiliadas/affiliates-view';

export const metadata: Metadata = {
  title: 'Afiliadas',
};

/**
 * `/admin/afiliadas` — reconstruida de adm-021 e adm-022.
 *
 * A PAGINA E UM COMPONENTE DE SERVIDOR e nao faz nada alem de montar a tela. O
 * estado (lista, rascunho, modal aberto, gravacao) vive no cliente, dentro de
 * `AffiliatesView`, e nao aqui: uma pagina de servidor nao guarda estado entre
 * interacoes, e mover a tela para ca seria trocar a arquitetura do painel
 * inteiro por nada.
 *
 * ================== DEFEITO DO PLACEHOLDER ANTERIOR: `references` ERRADO ==================
 *
 * Esta rota era servida pelo `ModulePage` com a faixa de prints ERRADA. O
 * intervalo esta errado na ponta de cima — os prints de Afiliadas sao adm-021 e
 * adm-022. O terceiro numero citado na faixa nao e desta tela: ele e o primeiro
 * print de FINANCEIRO (`Captura de tela ... 235234.png`, o modulo que vem logo
 * depois de Afiliadas na ordem do menu). CONFERIDO no arquivo: o `235234.png`
 * abre com o titulo `Financeiro` e os oito KPIs do modulo, e a sidebar dele
 * mostra `Afiliadas` logo acima de `Financeiro` — ou seja, o intervalo desta
 * tela termina mesmo no `adm-022`.
 *
 * E A SETIMA OCORRENCIA DO MESMO DEFEITO no projeto, depois de CRM, Carrinho
 * Abandonado, o mapa da Fase 2, Cupons, Campanhas e Fidelidade — e o par
 * Fidelidade/Afiliadas mostra o padrao inteiro numa tacada so:
 *
 *   FIDELIDADE dizia `adm-019 a adm-021` e o certo era `adm-018 a adm-020`.
 *   AFILIADAS  dizia `adm-022 a adm-023` e o certo era `adm-021 a adm-022`.
 *
 * OU SEJA: A FAIXA ERRADA DE FIDELIDADE EMPURROU O `adm-021` PARA AFILIADAS, E
 * A FAIXA ERRADA DE AFILIADAS EMPURROU O `adm-022` PARA O LUGAR DELE — de modo
 * que os dois erros, juntos, ESCONDIAM a contagem certa. Nenhum dos dois foi
 * pego por checagem alguma porque `references` e um atributo de EXIBICAO: ele
 * nao aponta para arquivo nenhum, so imprime uma faixa cinza na tela. Um numero
 * errado ali nunca quebrava nada, e por isso sobreviveu.
 *
 * O registro fica em vez de a correcao ser silenciosa pelo mesmo motivo das
 * outras seis: enquanto o `references` for texto livre, ele vai errar de novo, e
 * a proxima pessoa precisa saber que a conferencia tem que ser feita a mao
 * contra a pasta `Painel admin/`.
 *
 * ================== O QUE NAO MUDOU ==================
 *
 * A rota continua a mesma (`/admin/afiliadas`), o item de menu continua o mesmo
 * e o modulo nao ganhou I/O de banco. Nada aqui conecta o Neon — ver
 * `lib/afiliadas/data.ts`.
 */
export default function Afiliadas_Page() {
  return <AffiliatesView />;
}
