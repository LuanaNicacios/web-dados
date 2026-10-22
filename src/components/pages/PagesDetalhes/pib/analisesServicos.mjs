// Análises descritivas dos índices de serviços (PMS).
// Este módulo não presume ajuste sazonal nem comparabilidade entre séries distintas.
const numeroBR = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function formatarNumeroServicos(valor) {
  return Number.isFinite(valor) ? numeroBR.format(valor) : 'Sem informação'
}

export function calcularDiferencaIndice(atual, anterior) {
  if (!atual || !anterior || !Number.isFinite(atual.valor) || !Number.isFinite(anterior.valor)) {
    return null
  }
  const pontos = atual.valor - anterior.valor
  return {
    atual,
    anterior,
    pontos,
    percentual: anterior.valor === 0 ? null : (pontos / anterior.valor) * 100
  }
}

function mesAnterior(ano, mes) {
  const anoAnterior = mes === 1 ? ano - 1 : ano
  const numeroMes = mes === 1 ? 12 : mes - 1
  return `${anoAnterior}${String(numeroMes).padStart(2, '0')}`
}

function mesmoMesAnoAnterior(ano, mes) {
  return `${ano - 1}${String(mes).padStart(2, '0')}`
}

// registros: histórico completo, dadosFiltrados: mesmo indicador com o filtro de ano aplicado.
export function analisarServicos(registros, dadosFiltrados, campoIndicador) {
  const ordenados = [...dadosFiltrados].sort((a, b) => a.periodo.localeCompare(b.periodo))
  const validos = ordenados.filter((item) => Number.isFinite(item.valor))
  const mapaHistorico = new Map(
    registros.map((item) => [item.periodo, { ...item, valor: item.valores?.[campoIndicador] ?? null }])
  )
  const mapaFiltrado = new Map(ordenados.map((item) => [item.periodo, item]))

  const ultimo = validos.at(-1) ?? null
  const minimo = validos.length
    ? validos.reduce((atual, item) => item.valor < atual.valor ? item : atual, validos[0])
    : null
  const maximo = validos.length
    ? validos.reduce((atual, item) => item.valor > atual.valor ? item : atual, validos[0])
    : null

  // O mês anterior pode estar fora do ano filtrado; é buscado no histórico completo.
  const mensal = ultimo
    ? calcularDiferencaIndice(ultimo, mapaHistorico.get(mesAnterior(ultimo.ano, ultimo.mes)))
    : null
  const interanual = ultimo
    ? calcularDiferencaIndice(ultimo, mapaHistorico.get(mesmoMesAnoAnterior(ultimo.ano, ultimo.mes)))
    : null

  // Contamos apenas pares consecutivos, com ambos os meses dentro do filtro.
  const movimentos = { altas: 0, quedas: 0, estaveis: 0, comparacoes: 0 }
  for (const atual of validos) {
    const anterior = mapaFiltrado.get(mesAnterior(atual.ano, atual.mes))
    const comparacao = calcularDiferencaIndice(atual, anterior)
    if (!comparacao) continue
    movimentos.comparacoes += 1
    if (comparacao.pontos > 0) movimentos.altas += 1
    else if (comparacao.pontos < 0) movimentos.quedas += 1
    else movimentos.estaveis += 1
  }

  return {
    ultimo,
    minimo,
    maximo,
    mensal,
    interanual,
    movimentos,
    mesesComRegistro: ordenados.length,
    mesesComValor: validos.length,
    valoresAusentes: ordenados.length - validos.length
  }
}

export function descreverVariacaoServicos(comparacao) {
  if (!comparacao) return 'Comparação indisponível: falta valor válido em um dos períodos correspondentes.'
  const direcao = comparacao.pontos > 0
    ? 'aumento'
    : comparacao.pontos < 0 ? 'redução' : 'estabilidade'
  const diferenca = `${formatarNumeroServicos(Math.abs(comparacao.pontos))} ponto(s) do índice`
  const percentual = comparacao.percentual === null
    ? 'variação percentual relativa indisponível (valor de referência igual a zero)'
    : `${formatarNumeroServicos(Math.abs(comparacao.percentual))}% de variação relativa`
  if (direcao === 'estabilidade') {
    return `Estabilidade entre ${comparacao.anterior.periodoLabel} e ${comparacao.atual.periodoLabel}: diferença de ${diferenca}; ${percentual}.`
  }
  return `Houve ${direcao} de ${diferenca} entre ${comparacao.anterior.periodoLabel} e ${comparacao.atual.periodoLabel}; ${percentual}.`
}
