import React, { useMemo } from 'react'
import { analisarLavoura, formatarValorLavouras } from './analisesLavouras.mjs'
import './DestaquesLavouras.css'

function variacaoTexto(comparacao) {
  if (!comparacao) return 'Comparação indisponível'
  const diferenca = comparacao.diferenca
  return `${diferenca > 0 ? '+' : ''}${formatarValorLavouras(diferenca)}`
}

function textoPercentual(comparacao) {
  if (!comparacao) return 'Não há valores válidos nos dois períodos necessários.'
  if (comparacao.percentual === null) return 'Variação percentual indefinida: o valor anterior é zero.'
  const variacao = comparacao.percentual
  return `${variacao > 0 ? '+' : ''}${formatarValorLavouras(variacao)}% em relação ao valor anterior`
}

function classeComparacao(comparacao) {
  if (!comparacao) return 'lvd-cartao-neutro'
  if (comparacao.diferenca > 0) return 'lvd-cartao-alta'
  if (comparacao.diferenca < 0) return 'lvd-cartao-baixa'
  return 'lvd-cartao-neutro'
}

function Comparacao({ titulo, comparacao, observacao }) {
  return (
    <article className={`lvd-cartao ${classeComparacao(comparacao)}`}>
      <span className="lvd-rotulo">{titulo}</span>
      <strong className="lvd-valor">{variacaoTexto(comparacao)}</strong>
      <span className="lvd-unidade">Diferença em unidades da base (a validar)</span>
      <p className="lvd-detalhe">
        {comparacao
          ? `${comparacao.anterior.periodoLabel}: ${formatarValorLavouras(comparacao.anterior.valor)} → ${comparacao.atual.periodoLabel}: ${formatarValorLavouras(comparacao.atual.valor)}`
          : observacao}
      </p>
      <p className="lvd-percentual">{textoPercentual(comparacao)}</p>
    </article>
  )
}

export default function DestaquesLavouras({ registros, dadosFiltrados, campo, nomeIndicador, anoSelecionado }) {
  const analise = useMemo(
    () => analisarLavoura(registros, dadosFiltrados, campo),
    [registros, dadosFiltrados, campo]
  )

  const {
    ultimo, minimo, maximo, mensal, interanual,
    quantidadeRegistros, quantidadeValidos, quantidadeAusentes,
    quantidadeZeros, periodosSemLinha, ultimoPeriodoSemValor, movimentos
  } = analise

  return (
    <section className="lvd-painel" aria-labelledby="lvd-titulo">
      <div className="lvd-cabecalho">
        <div>
          <span className="lvd-etiqueta">LEITURA DESCRITIVA DOS DADOS</span>
          <h3 id="lvd-titulo">Destaques da análise — {nomeIndicador}</h3>
          <p>
            {anoSelecionado === 'todos' ? 'Todos os anos disponíveis' : `Ano ${anoSelecionado}`}
            {' · '}As observações acompanham os filtros aplicados.
          </p>
        </div>
      </div>

      {quantidadeValidos === 0 ? (
        <div className="lvd-alerta lvd-alerta-atencao" role="status">
          Esta lavoura não apresenta valores numéricos no período selecionado.
          Os registros sem informação não foram convertidos em zero.
        </div>
      ) : (
        <>
          <div className="lvd-grade">
            <Comparacao
              titulo="Mudança em relação ao mês anterior"
              comparacao={mensal}
              observacao="Não há registro numérico válido do mês imediatamente anterior ao último valor disponível."
            />
            <Comparacao
              titulo="Mudança em relação ao mesmo mês do ano anterior"
              comparacao={interanual}
              observacao="Não há registro numérico válido do mesmo mês no ano anterior."
            />
            <article className="lvd-cartao lvd-cartao-neutro">
              <span className="lvd-rotulo">Maior valor no filtro</span>
              <strong className="lvd-valor">{formatarValorLavouras(maximo?.valor)}</strong>
              <p className="lvd-detalhe">{maximo?.periodoLabel ?? 'Sem período'}</p>
              <p className="lvd-percentual">Menor: {formatarValorLavouras(minimo?.valor)} ({minimo?.periodoLabel ?? '—'})</p>
            </article>
            <article className="lvd-cartao lvd-cartao-neutro">
              <span className="lvd-rotulo">Cobertura do indicador</span>
              <strong className="lvd-valor">{quantidadeValidos} de {quantidadeRegistros}</strong>
              <p className="lvd-detalhe">Meses com valor numérico / meses com registro</p>
              <p className="lvd-percentual">Último valor válido: {ultimo?.periodoLabel ?? '—'}</p>
            </article>
          </div>

          <div className="lvd-resumo">
            <h4>Comportamento da série no período filtrado</h4>
            <p>
              Entre meses consecutivos com valores válidos, houve{' '}
              <strong>{movimentos.aumentos} aumento(s)</strong>,{' '}
              <strong>{movimentos.reducoes} redução(ões)</strong> e{' '}
              <strong>{movimentos.iguais} ocorrência(s) sem alteração</strong>
              {' '}em {movimentos.pares} comparação(ões) possível(is).
            </p>
            {movimentos.pares === 0 && (
              <p>Não há dois meses consecutivos com valores válidos suficientes para comparar.</p>
            )}
          </div>
        </>
      )}

      {(quantidadeAusentes > 0 || quantidadeZeros > 0 || periodosSemLinha > 0 || ultimoPeriodoSemValor) && (
        <div className="lvd-alerta lvd-alerta-atencao">
          <h4>Pontos de atenção</h4>
          <ul>
            {quantidadeAusentes > 0 && (
              <li>{quantidadeAusentes} mês(es) com registro, mas sem valor numérico para esta lavoura.</li>
            )}
            {quantidadeZeros > 0 && (
              <li>{quantidadeZeros} valor(es) explicitamente registrado(s) como zero; confirmar o significado com a equipe de dados.</li>
            )}
            {periodosSemLinha > 0 && (
              <li>{periodosSemLinha} mês(es) sem linha na base entre o primeiro e o último período do filtro.</li>
            )}
            {ultimoPeriodoSemValor && quantidadeValidos > 0 && (
              <li>O último período com registro não tem valor para esta lavoura; o último valor mostrado é anterior a ele.</li>
            )}
          </ul>
        </div>
      )}

      <p className="lvd-nota">
        Fonte: pib.lavouras. Valores apresentados como registrados no banco. Unidade e significado
        dos indicadores ainda dependem de validação. Diferenças e variações relativas são
        calculadas somente para a mesma lavoura, comparando períodos exatos. Uma alta ou
        redução numérica não indica, por si só, melhora ou piora econômica.
      </p>
    </section>
  )
}
