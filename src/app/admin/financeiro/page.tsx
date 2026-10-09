import type { Metadata } from 'next';
import { FinanceView } from '@/components/admin/financeiro/finance-view';

export const metadata: Metadata = {
  title: 'Financeiro',
};

/**
 * `/admin/financeiro` — reconstruida de adm-023 e adm-024.
 *
 * A PAGINA E UM COMPONENTE DE SERVIDOR e nao faz nada alem de montar a tela. O
 * estado (periodo, datas personalizadas, pedidos, custos, gravacao) vive no
 * cliente, dentro de `FinanceView`: uma pagina de servidor nao guarda estado
 * entre interacoes, e mover o relatorio para ca seria trocar a arquitetura do
 * painel inteiro por nada.
 *
 * ================== OITAVA OCORRENCIA DO DEFEITO DE `references` ==================
 *
 * Esta rota era servida pelo `ModulePage` com a faixa de prints ERRADA:
 *
 *   dizia   `adm-024 a adm-031`
 *   certo   `adm-023 e adm-024`
 *
 * E ERRADA PELAS DUAS PONTAS, e as duas foram conferidas no arquivo:
 *
 *   ADM-023 FALTAVA NO COMECO. A faixa comecava no `adm-024` e deixava de fora o
 *   print de ABERTURA do modulo, que e justamente o que traz os oito KPIs e a
 *   linha de filtros — a metade mais visivel da tela. CONFERIDO: o
 *   `235234.png` abre com o titulo `Financeiro`, a descricao e os oito cartoes.
 *
 *   ADM-031 NAO E DESTA TELA. Nao existe print de Financeiro depois do `adm-024`.
 *   CONFERIDO: o `235244.png` e a continuacao direta (`Formas de pagamento` e
 *   `Pedidos por status` vazios, `Custos`, `Lucro estimado`), e o arquivo
 *   seguinte na pasta — `235257.png` — ja e de OUTRO modulo.
 *
 * E A SEGUNDA OCORRENCIA CONSECUTIVA DO MESMO DEFEITO. A primeira foi em
 * Afiliadas, o modulo imediatamente anterior na ordem do menu, cuja faixa dizia
 * `adm-022 a adm-023` e empurrava o `adm-023` — o PRIMEIRO print de Financeiro —
 * para dentro de Afiliadas. Ou seja: o `adm-023` estava sendo ANUNCIADO no
 * placeholder de Afiliadas e AUSENTE do placeholder de Financeiro, que era o dono
 * dele.
 *
 * Olhando os dois juntos, o padrao fica visivel: cada modulo pegava um print do
 * vizinho de baixo no comeco da faixa e empurrava o proprio primeiro print para o
 * modulo de cima. O resultado e uma CORRENTE DESLOCADA DE UM PRINT ao longo de
 * toda a fila — e nenhuma checagem pegava, porque `references` e um atributo de
 * EXIBICAO: ele nao aponta para arquivo, so imprime uma faixa cinza. Um intervalo
 * errado ali nunca quebrou nada, e por isso sobreviveu a oito modulos.
 *
 * O registro fica, em vez de a correcao ser silenciosa, pelo mesmo motivo das
 * outras sete: enquanto o `references` for texto livre, ele vai errar de novo.
 * A conferencia tem que ser feita A MAO contra a pasta `Painel admin/`.
 *
 * ================== O QUE NAO MUDOU ==================
 *
 * A rota continua `/admin/financeiro`, o item de menu continua o mesmo e o modulo
 * nao ganhou I/O de banco. Nada aqui conecta o Neon — ver `lib/financeiro/data.ts`
 * e a secao "Pendencias para Neon" no mesmo arquivo.
 */
export default function Financeiro_Page() {
  return <FinanceView />;
}
