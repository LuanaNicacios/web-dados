import React from 'react'
import { formatarValor } from './DashboardNovosUtils'
import { rotuloTrimestre } from './analisesOcupacaoRendimento.mjs'
import './DestaquesOcupacaoRendimento.css'

const formatarSinal = (numero) =>
  numero === null || numero === undefined ? 'Sem comparação' :
    `${numero > 0 ? '+' : ''}${formatarValor(numero)}`

function LinhaComparacao({ titulo, comparacao, referencia }) {
  return (
    <div className="or-analise-linha">
      <span className="or-analise-descricao">{titulo}</span>
      <strong className={comparacao === null ? 'or-analise-neutro' : comparacao.diferenca > 0 ? 'or-analise-positivo' : comparacao.diferenca < 0 ? 'or-analise-negativo' : 'or-analise-neutro'}>
        {comparacao ? formatarSinal(comparacao.diferenca) : 'Indisponível'}
      </strong>
      <small>
        {comparacao
          ? `Em relação a ${referencia}. ${comparacao.percentual === null ? 'Variação relativa indisponível (referência igual a zero).' : `${formatarSinal(comparacao.percentual)}% de variação relativa.`}`
          : `Não há dois valores válidos para comparar com ${referencia}.`}
      </small>
    </div>
  )
}

function PainelMedida({ titulo, cor, analise, referenciaTrimestral, referenciaAnual }) {
  return (
    <div className={`or-analise-medida or-analise-${cor}`}>
      <h4>{titulo}</h4>
      <div className="or-analise-grade">
        <div>
          <span>Maior valor no filtro</span>
          <strong>{formatarValor(analise.maior?.valor)}</strong>
          <small>{analise.maior?.extenso || 'Sem valor disponível'}</small>
        </div>
        <div>
          <span>Menor valor no filtro</span>
          <strong>{formatarValor(analise.menor?.valor)}</strong>
          <small>{analise.menor?.extenso || 'Sem valor disponível'}</small>
        </div>
      </div>
      <div className="or-analise-comparacoes">
        <LinhaComparacao titulo="Diferença trimestral" comparacao={analise.trimestral} referencia={referenciaTrimestral} />
        <LinhaComparacao titulo="Diferença interanual" comparacao={analise.interanual} referencia={referenciaAnual} />
      </div>
    </div>
  )
}

export default function DestaquesOcupacaoRendimento({ analise, nomeSetor, tipoRanking, ranking }) {
  if (!analise || !analise.ultimo) {
    return <article className="or-analise-container"><h3>Destaques do período</h3><p>Não há trimestres para os filtros selecionados.</p></article>
  }

  const { ultimo, totalPeriodos, ocupacao, rendimento, trimestreAnterior, anoAnterior } = analise
  const ausencias = ocupacao.ausentes + rendimento.ausentes
  const maisAlto = ranking?.[0] || null

  return (
    <article className="or-analise-container" aria-label="Destaques analíticos de ocupação e rendimento">
      <div className="or-analise-cabecalho">
        <div>
          <span className="or-analise-etiqueta">Leitura descritiva dos registros</span>
          <h3>Destaques do período selecionado</h3>
          <p><strong>Atividade:</strong> {nomeSetor} · <strong>Último trimestre no filtro:</strong> {ultimo.extenso}</p>
        </div>
        <span className="or-analise-periodos">{totalPeriodos} trimestre(s)</span>
      </div>

      <div className="or-analise-paineis">
        <PainelMedida titulo="Pessoas ocupadas" cor="azul" analise={ocupacao}
          referenciaTrimestral={rotuloTrimestre(trimestreAnterior)} referenciaAnual={rotuloTrimestre(anoAnterior)} />
        <PainelMedida titulo="Rendimento efetivo" cor="verde" analise={rendimento}
          referenciaTrimestral={rotuloTrimestre(trimestreAnterior)} referenciaAnual={rotuloTrimestre(anoAnterior)} />
      </div>

      <div className="or-analise-avisos">
        <div className="or-analise-aviso or-analise-informativo">
          <strong>Comparações exatas</strong>
          <p>As diferenças trimestrais usam o trimestre imediatamente anterior; as interanuais usam o mesmo trimestre do ano anterior. As referências podem estar fora do filtro de ano ou trimestre, mas são consultadas na série histórica da mesma atividade.</p>
        </div>
        <div className={`or-analise-aviso ${ausencias ? 'or-analise-atencao' : 'or-analise-informativo'}`}>
          <strong>Qualidade dos registros selecionados</strong>
          <p>{ocupacao.ausentes} valor(es) ausente(s) de ocupação e {rendimento.ausentes} de rendimento. {ausencias ? 'Valores ausentes não são tratados como zero.' : 'Nenhum valor ausente nas duas medidas do filtro.'}</p>
        </div>
        {maisAlto && (
          <div className="or-analise-aviso or-analise-informativo">
            <strong>Maior valor na comparação por atividade</strong>
            <p>{maisAlto.nome}: {formatarValor(maisAlto.valor)} ({tipoRanking === 'ocupacao' ? 'ocupação' : 'rendimento'}, {ultimo.extenso}). As categorias podem se sobrepor.</p>
          </div>
        )}
        <div className="or-analise-aviso or-analise-metodologia">
          <strong>Limites de interpretação</strong>
          <p>As unidades ainda precisam ser confirmadas com a equipe de dados. As diferenças são expressas nas unidades originais dos indicadores; os percentuais exibidos são variações relativas calculadas, não taxas de ocupação ou inflação. Não some setores sobrepostos, nem infira causalidade entre rendimento e ocupação.</p>
        </div>
      </div>
    </article>
  )
}
