// Análises descritivas trimestrais. Não presume unidades, não soma atividades
// e preserva valores ausentes (null) e zeros legítimos.

function anteriorTrimestre(periodo) {
  const texto = String(periodo ?? '')
  if (!/^\d{6}$/.test(texto)) return null
  const ano = Number(texto.slice(0, 4))
  const trimestre = Number(texto.slice(4, 6))
  if (trimestre < 1 || trimestre > 4) return null
  return trimestre === 1
    ? `${ano - 1}04`
    : `${ano}${String(trimestre - 1).padStart(2, '0')}`
}

function mesmoTrimestreAnoAnterior(periodo) {
  const texto = String(periodo ?? '')
  if (!/^\d{4}0[1-4]$/.test(texto)) return null
  return `${Number(texto.slice(0, 4)) - 1}${texto.slice(4)}`
}

function numeroValido(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null
}

function rotuloTrimestre(periodo) {
  if (!/^\d{4}0[1-4]$/.test(String(periodo ?? ''))) return 'período indisponível'
  return `${Number(periodo.slice(4))}º trimestre de ${periodo.slice(0, 4)}`
}

function comparar(atual, referencia, periodoReferencia) {
  if (atual === null || referencia === null) return null
  const diferenca = atual - referencia
  return {
    diferenca,
    percentual: referencia !== 0 ? (diferenca / Math.abs(referencia)) * 100 : null,
    periodoReferencia,
    atual,
    referencia
  }
}

function extremos(registros, chave) {
  const validos = registros
    .filter((item) => numeroValido(item[chave]) !== null)
    .sort((a, b) => String(a.periodo).localeCompare(String(b.periodo)))

  if (!validos.length) return { menor: null, maior: null, validos: 0 }
  let menor = validos[0]
  let maior = validos[0]
  for (const item of validos.slice(1)) {
    if (item[chave] < menor[chave]) menor = item
    if (item[chave] > maior[chave]) maior = item
  }
  return {
    menor: { periodo: menor.periodo, extenso: menor.extenso, valor: menor[chave] },
    maior: { periodo: maior.periodo, extenso: maior.extenso, valor: maior[chave] },
    validos: validos.length
  }
}

/**
 * dados: resposta trimestral já validada; serie: apenas trimestres visíveis
 * no filtro, enriquecidos com ocupacaoValor e rendimentoValor.
 * As comparações procuram o trimestre EXATO no histórico completo, mesmo
 * quando o período de referência está fora do filtro de exibição.
 */
export function calcularAnaliseOcupacaoRendimento(dados, serie, setor) {
  const selecao = [...(serie || [])].sort((a, b) => a.periodo.localeCompare(b.periodo))
  const ultimo = selecao.at(-1) || null
  const historico = new Map((dados || []).map((item) => [item.periodo, item]))

  const trimestreAnterior = ultimo ? anteriorTrimestre(ultimo.periodo) : null
  const anoAnterior = ultimo ? mesmoTrimestreAnoAnterior(ultimo.periodo) : null

  function criarMedida(tipo, chave) {
    const atual = numeroValido(ultimo?.[chave])
    const valorHistorico = (periodo) => numeroValido(historico.get(periodo)?.[tipo]?.[setor])
    const referenciaTrimestral = trimestreAnterior ? valorHistorico(trimestreAnterior) : null
    const referenciaAnual = anoAnterior ? valorHistorico(anoAnterior) : null
    const medidas = extremos(selecao, chave)
    return {
      atual,
      ...medidas,
      ausentes: selecao.length - medidas.validos,
      trimestral: comparar(atual, referenciaTrimestral, trimestreAnterior),
      interanual: comparar(atual, referenciaAnual, anoAnterior)
    }
  }

  return {
    ultimo,
    totalPeriodos: selecao.length,
    trimestreAnterior,
    anoAnterior,
    trimestreAnteriorLabel: trimestreAnterior ? rotuloTrimestre(trimestreAnterior) : null,
    anoAnteriorLabel: anoAnterior ? rotuloTrimestre(anoAnterior) : null,
    ocupacao: criarMedida('ocupacao', 'ocupacaoValor'),
    rendimento: criarMedida('rendimento', 'rendimentoValor')
  }
}

export { anteriorTrimestre, mesmoTrimestreAnoAnterior, rotuloTrimestre }
