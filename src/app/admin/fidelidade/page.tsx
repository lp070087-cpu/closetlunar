import type { Metadata } from 'next';
import { FidelidadeView } from '@/components/admin/fidelidade/fidelidade-view';

export const metadata: Metadata = {
  title: 'Fidelidade',
};

/**
 * `/admin/fidelidade` — reconstruida de adm-018, adm-019 e adm-020.
 *
 * A PAGINA E UM COMPONENTE DE SERVIDOR e nao faz nada alem de montar a tela. O
 * estado (aba ativa, rascunhos, gravacao) vive no cliente, dentro de
 * `FidelidadeView`, e nao aqui: uma pagina de servidor nao guarda estado entre
 * interacoes, e mover a tela para ca seria trocar a arquitetura do painel inteiro
 * por nada.
 *
 * ================== DEFEITO DO PLACEHOLDER ANTERIOR: `references` ERRADO ==================
 *
 * Esta rota era servida pelo `ModulePage` com `references="adm-019 a adm-021"`.
 * O intervalo esta ERRADO — os prints de Fidelidade sao adm-018, adm-019 e
 * adm-020. O `adm-021` citado na faixa nao e desta tela: ele e o primeiro print de
 * AFILIADAS (`Captura de tela ...233222.png`, a tela de programa de afiliados que
 * vem logo depois de Fidelidade na ordem do menu).
 *
 * A faixa erra nas DUAS pontas, e isso e o que ela tem de mais util como exemplo:
 * come por baixo (o `adm-018`, que e a tela principal, fica de fora) e sobra por
 * cima (o `adm-021`, que e do modulo seguinte). Uma faixa escrita "pelo titulo da
 * tela" erra assim mesmo — para os dois lados.
 *
 * E A SEXTA OCORRENCIA DO MESMO DEFEITO no projeto, depois de CRM, Carrinho
 * Abandonado, o mapa da Fase 2, Cupons e Campanhas, e ele tem sempre a mesma
 * forma: o `references` foi escrito pelo TITULO da tela e nao pela lista real de
 * arquivos, e nenhuma checagem o pegou porque `references` e um atributo de
 * exibicao — ele nao aponta para arquivo nenhum, so imprime uma faixa cinza na
 * tela. Um numero errado ali nunca quebrava nada, e por isso sobreviveu.
 *
 * O registro fica em vez de a correcao ser silenciosa pelo mesmo motivo das
 * outras cinco: enquanto o `references` for texto livre, ele vai errar de novo, e
 * a proxima pessoa precisa saber que a conferencia tem que ser feita a mao contra
 * a pasta `Painel admin/`.
 *
 * ================== O QUE NAO MUDOU ==================
 *
 * A rota continua a mesma (`/admin/fidelidade`), o item de menu continua o mesmo e
 * o modulo nao ganhou I/O de banco. Nada aqui conecta o Neon — ver `lib/fidelidade/data.ts`.
 */
export default function Fidelidade_Page() {
  return <FidelidadeView />;
}
