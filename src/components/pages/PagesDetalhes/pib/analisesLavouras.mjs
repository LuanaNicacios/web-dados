// Funções puras para a leitura descritiva da série de UMA lavoura.
// Não atribui unidade nem interpreta variação como efeito econômico ou causa.

export const numeroLavouras = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2
})

export function formatarValorLavouras(valor) {
  return Number.isFinite(valor) ? numeroLavouras.format(valor) : 'Sem informação'
}

function codigoMesAnterior(ano, mes) {
  const a = mes === 1 ? ano - 1 : ano
  const m = mes === 1 ? 12 : mes - 1
  return `${a}${String(m).padStart(2, '0')}`
}

function codigoMesmoMesAnoAnterior(ano, mes) {
  return `${ano - 1}${String(mes).padStart(2, '0')}`
}

function comparar(atual, anterior) {
  if (!atual || !anterior || !Number.isFinite(atual.valor) || !Number.isFinite(anterior.valor)) {
    return null
  }
  const diferenca = atual.valor - anterior.valor
  return {
    atual,
    anterior,
    diferenca,
    percentual: anterior.valor === 0 ? null : (diferenca / anterior.valor) * 100
  }
}

function proximoCodigo(codigo) {
  const ano = Number(codigo.slice(0, 4))
  const mes = Number(codigo.slice(4, 6))
  return mes === 12 ? `${ano + 1}01` : `${ano}${String(mes + 1).padStart(2, '0')}`
}

export function analisarLavoura(registros, dadosFiltrados, campo) {
  const selecionados = [...dadosFiltrados].sort((a, b) => a.periodo.localeCompare(b.periodo))
  const validos = selecionados.filter((item) => Number.isFinite(item.valor))
  const ultimo = validos.at(-1) ?? null
  const minimo = validos.reduce((menor, item) => !menor || item.valor < menor.valor ? item : menor, null)
  const maximo = validos.reduce((maior, item) => !maior || item.valor > maior.valor ? item : maior, null)
  const quantidadeAusentes = selecionados.length - validos.length
  const quantidadeZeros = validos.filter((item) => item.valor === 0).length

  // A comparação é sempre da MESMA lavoura, usando períodos exatos.
  // O mês/ano anterior pode ficar fora do ano selecionado; por isso, usamos o histórico.
  const historico = new Map(registros.map((item) => [
    item.periodo,
    { ...item, valor: item.valores?.[campo] ?? null }
  ]))
  const mapaSelecionados = new Map(selecionados.map((item) => [item.periodo, item]))

  const mensal = ultimo
    ? comparar(ultimo, historico.get(codigoMesAnterior(ultimo.ano, ultimo.mes)))
    : null
  const interanual = ultimo
    ? comparar(ultimo, historico.get(codigoMesmoMesAnoAnterior(ultimo.ano, ultimo.mes)))
    : null

  const movimentos = { aumentos: 0, reducoes: 0, iguais: 0, pares: 0 }
  for (const atual of validos) {
    const anterior = mapaSelecionados.get(codigoMesAnterior(atual.ano, atual.mes))
    const calculo = comparar(atual, anterior)
    if (!calculo) continue
    movimentos.pares++
    if (calculo.diferenca > 0) movimentos.aumentos++
    else if (calculo.diferenca < 0) movimentos.reducoes++
    else movimentos.iguais++
  }

  // Diferente de uma célula NULL: mês completamente sem linha no intervalo consultado.
  // Não presume a existência de dados antes da primeira linha nem depois da última.
  let periodosSemLinha = 0
  if (selecionados.length > 1) {
    const existentes = new Set(selecionados.map((item) => item.periodo))
    let atual = selecionados[0].periodo
    const fim = selecionados.at(-1).periodo
    for (let passos = 0; atual <= fim && passos < 2400; passos++) {
      if (!existentes.has(atual)) periodosSemLinha++
      atual = proximoCodigo(atual)
    }
  }

  return {
    ultimo,
    minimo,
    maximo,
    mensal,
    interanual,
    quantidadeRegistros: selecionados.length,
    quantidadeValidos: validos.length,
    quantidadeAusentes,
    quantidadeZeros,
    periodosSemLinha,
    ultimoPeriodoSemValor: selecionados.length > 0 && !Number.isFinite(selecionados.at(-1).valor),
    movimentos
  }
}
