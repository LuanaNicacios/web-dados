// Funcoes puras, sem dependencias de React ou do banco.
// Nao transformam lacunas em zero e nao pressupõem ajuste sazonal.
const BR = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export const formatarNumeroComercio = (valor) =>
  valor === null || valor === undefined || !Number.isFinite(valor)
    ? 'Sem informação'
    : BR.format(valor)

export function calcularComparacaoIndice(atual, anterior) {
  if (!atual || !anterior || !Number.isFinite(atual.valor) || !Number.isFinite(anterior.valor)) {
    return null
  }
  const pontos = atual.valor - anterior.valor
  const percentual = anterior.valor !== 0 ? (pontos / anterior.valor) * 100 : null
  return { atual, anterior, pontos, percentual }
}

// Períodos AAAAMM; calculo cronologico evita comparar meses nao adjacentes.
const periodoAnterior = (ano, mes) => `${mes === 1 ? ano - 1 : ano}${String(mes === 1 ? 12 : mes - 1).padStart(2, '0')}`
const periodoMesmoMesAnoAnterior = (ano, mes) => `${ano - 1}${String(mes).padStart(2, '0')}`

export function analisarComercio(registros, filtrados) {
  const validos = filtrados.filter((item) => Number.isFinite(item.valor))
  if (validos.length === 0) return null

  const ordenados = [...validos].sort((a, b) => a.periodo.localeCompare(b.periodo))
  const ultimo = ordenados[ordenados.length - 1]
  const minimo = ordenados.reduce((acc, item) => item.valor < acc.valor ? item : acc, ordenados[0])
  const maximo = ordenados.reduce((acc, item) => item.valor > acc.valor ? item : acc, ordenados[0])

  const historico = new Map(registros.filter((i) => Number.isFinite(i.valor)).map((i) => [i.periodo, i]))
  const mensal = calcularComparacaoIndice(ultimo, historico.get(periodoAnterior(ultimo.ano, ultimo.mes)))
  const interanual = calcularComparacaoIndice(ultimo, historico.get(periodoMesmoMesAnoAnterior(ultimo.ano, ultimo.mes)))

  const dentroFiltro = new Map(ordenados.map((i) => [i.periodo, i]))
  const movimentos = { altas: 0, quedas: 0, estaveis: 0, comparacoes: 0 }
  for (const item of ordenados) {
    const anterior = dentroFiltro.get(periodoAnterior(item.ano, item.mes))
    const resultado = calcularComparacaoIndice(item, anterior)
    if (!resultado) continue
    movimentos.comparacoes += 1
    if (resultado.pontos > 0) movimentos.altas += 1
    else if (resultado.pontos < 0) movimentos.quedas += 1
    else movimentos.estaveis += 1
  }

  return {
    ultimo,
    minimo,
    maximo,
    mensal,
    interanual,
    movimentos,
    registrosSemValor: filtrados.length - validos.length
  }
}

export function descreverComparacaoIndice(comparacao) {
  if (!comparacao) return 'Não há período anterior correspondente com valor válido para esta comparação.'
  const sinal = comparacao.pontos > 0 ? 'aumento' : comparacao.pontos < 0 ? 'redução' : 'estabilidade'
  const pontos = formatarNumeroComercio(Math.abs(comparacao.pontos))
  const percentual = comparacao.percentual === null
    ? 'sem variação relativa calculável (base igual a zero)'
    : `${formatarNumeroComercio(Math.abs(comparacao.percentual))}% de variação relativa`
  return `${sinal === 'estabilidade' ? 'Estabilidade' : `Houve ${sinal}`} de ${pontos} ponto(s) do índice entre ${comparacao.anterior.periodoLabel} e ${comparacao.atual.periodoLabel}; ${percentual}.`
}
