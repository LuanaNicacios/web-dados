import React from 'react'
import { formatarValor } from './DashboardNovosUtils'
import './DestaquesIpca.css'

function diferencaTexto(comparacao) {
  if (!comparacao) return 'Indisponível'
  const valor = comparacao.diferenca
  // Normaliza -0 apenas na exibição, sem alterar o dado.
  const normalizado = Math.abs(valor) < 1e-10 ? 0 : valor
  return `${normalizado > 0 ? '+' : ''}${formatarValor(normalizado)}`
}

function CardAnalitico({ titulo, valor, descricao, classe = '' }) {
  return (
    <div className={`ipca-destaque-card ${classe}`}>
      <span>{titulo}</span>
      <strong>{valor}</strong>
      <small>{descricao}</small>
    </div>
  )
}

export default function DestaquesIpca({ analise, nomeIndicador, indicadores }) {
  const { serie, ultimo, maior, menor, mensal, interanual,
    movimentos, sinais, mesesSemValor, mesesSemRegistro, anosParciais } = analise

  const itensComponentes = indicadores.map(({ campo, nome }) => ({
    campo,
    nome,
    valor: ultimo?.valores?.[campo] ?? null
  }))

  return (
    <article className="ipca-destaques" aria-label="Destaques analíticos do IPCA">
      <div className="ipca-destaques-cabecalho">
        <div>
          <span className="ipca-destaques-kicker">LEITURA DOS INDICADORES</span>
          <h3>Destaques do período selecionado</h3>
          <p>Indicador: <strong>{nomeIndicador}</strong>. Resultados calculados automaticamente com os filtros.</p>
        </div>
      </div>

      {ultimo ? (
        <>
          <div className="ipca-destaques-grade">
            <CardAnalitico titulo="Último valor disponível" valor={formatarValor(ultimo.valor)} descricao={ultimo.extenso} classe="ipca-destaque-azul" />
            <CardAnalitico titulo="Diferença mensal" valor={diferencaTexto(mensal)} descricao={mensal ? `Comparação: ${mensal.rotuloAnterior}` : 'Mês imediatamente anterior indisponível'} classe="ipca-destaque-turquesa" />
            <CardAnalitico titulo="Diferença interanual" valor={diferencaTexto(interanual)} descricao={interanual ? `Mesmo mês de ${interanual.rotuloAnterior.split('/').at(-1)}` : 'Mesmo mês do ano anterior indisponível'} classe="ipca-destaque-roxo" />
            <CardAnalitico titulo="Meses com valor" valor={`${serie.length - mesesSemValor} de ${serie.length}`} descricao="Registros no período filtrado" classe="ipca-destaque-verde" />
          </div>

          <div className="ipca-destaques-blocos">
            <div className="ipca-destaques-bloco">
              <h4>Valores extremos no filtro</h4>
              <p><strong>Maior valor:</strong> {formatarValor(maior.valor)} — {maior.extenso}.</p>
              <p><strong>Menor valor:</strong> {formatarValor(menor.valor)} — {menor.extenso}.</p>
              <p className="ipca-destaques-observacao">Os extremos são valores numéricos, não uma avaliação econômica positiva ou negativa.</p>
            </div>
            <div className="ipca-destaques-bloco">
              <h4>Comportamento dos registros</h4>
              <p><strong>Sinais:</strong> {sinais.positivos} positivos, {sinais.negativos} negativos e {sinais.zeros} iguais a zero.</p>
              <p><strong>Entre meses consecutivos:</strong> {movimentos.altas} altas, {movimentos.quedas} quedas e {movimentos.estaveis} estáveis ({movimentos.comparaveis} comparações válidas).</p>
              <p className="ipca-destaques-observacao">Alta ou queda significa apenas mudança no valor informado, não variação percentual de preços.</p>
            </div>
          </div>

          <div className="ipca-destaques-componentes">
            <h4>Indicadores no último mês selecionado — {ultimo.extenso}</h4>
            <div className="ipca-destaques-lista">
              {itensComponentes.map((item) => (
                <div key={item.campo}>
                  <span title={item.nome}>{item.nome}</span>
                  <strong>{formatarValor(item.valor)}</strong>
                </div>
              ))}
            </div>
            <p className="ipca-destaques-observacao">Visualização lado a lado, sem soma ou ordenação de componentes. Comparabilidade e unidades ainda precisam de validação.</p>
          </div>
        </>
      ) : (
        <p className="ipca-destaques-vazio">Não há valores válidos para o indicador neste filtro.</p>
      )}

      {(mesesSemValor > 0 || mesesSemRegistro > 0 || anosParciais.length > 0) && (
        <div className="ipca-destaques-alerta">
          <strong>Pontos de atenção</strong>
          <p>
            {mesesSemValor} registro(s) sem valor para o indicador; {mesesSemRegistro} mês(es) sem registro entre o primeiro e o último mês exibidos.
            {anosParciais.length > 0 && ` Anos com cobertura parcial no filtro: ${anosParciais.join(', ')}.`}
          </p>
        </div>
      )}
      <p className="ipca-destaques-rodape">
        Fonte: pib.ipca. As diferenças mensal e interanual são subtrações entre valores informados,
        sem unidade confirmada. Não representam automaticamente taxas percentuais ou inflação acumulada.
      </p>
    </article>
  )
}
