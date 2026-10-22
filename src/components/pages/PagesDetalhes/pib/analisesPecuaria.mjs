// Cálculos descritivos puros. Não presume unidade, conceito ou frequência confirmados.
export const MESES_PECUARIA = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export const GRUPOS_PECUARIA = {
  animais: {
    titulo: 'Bovinos, Suínos e Aves',
    campos: ['aves', 'bovinos', 'suinos'],
    descricao: 'Séries individuais de indicadores de animais, conforme os valores disponíveis no banco.'
  },
  produtos: {
    titulo: 'Leite e Ovos',
    campos: ['leite', 'ovos'],
    descricao: 'Séries individuais de leite e ovos, com períodos e unidades tratados separadamente.'
  }
}

export const ROTULOS_PECUARIA = {
  aves: 'Aves', bovinos: 'Bovinos', suinos: 'Suínos', leite: 'Leite', ovos: 'Ovos'
}

export function interpretarPeriodoPecuaria(valor) {
  const periodo = String(valor ?? '').trim()
  if (!/^(?:19|20)\d{2}(?:0[1-9]|1[0-2])$/.test(periodo)) return null
  const ano = Number(periodo.slice(0, 4))
  const mes = Number(periodo.slice(4, 6))
  return {
    periodo,
    ano,
    mes,
    rotulo: `${MESES_PECUARIA[mes - 1]}/${String(ano).slice(-2)}`,
    extenso: `${MESES_PECUARIA[mes - 1]}/${ano}`
  }
}

export function numeroPecuaria(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = typeof valor === 'number' ? valor : Number(String(valor).trim())
  return Number.isFinite(numero) ? numero : null
}

export function formatarPecuaria(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return 'Sem informação'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(valor)
}

export function formatarDiferencaPecuaria(valor) {
  if (valor === null || !Number.isFinite(valor)) return 'Indisponível'
  const sinal = valor > 0 ? '+' : ''
  return `${sinal}${formatarPecuaria(valor)}`
}

// Normaliza o retorno da rota /api/pecuaria e valida sua estrutura.
export function prepararPecuaria(resposta) {
  if (resposta?.status !== 'sucesso' || !Array.isArray(resposta.dados) ||
      !Array.isArray(resposta.indicadores) || !Array.isArray(resposta.cobertura)) {
    throw new Error('Formato inesperado da API de pecuária')
  }
  const campos = Object.keys(ROTULOS_PECUARIA)
  const vistos = new Set()
  const dados = resposta.dados.map((item) => {
    const data = interpretarPeriodoPecuaria(item.periodo)
    if (!data || vistos.has(data.periodo)) throw new Error('Período inválido ou duplicado')
    vistos.add(data.periodo)
    return {
      ...data,
      valores: Object.fromEntries(campos.map((campo) => [campo, numeroPecuaria(item.valores?.[campo])]))
    }
  }).sort((a, b) => a.periodo.localeCompare(b.periodo))

  const cobertura = {}
  for (const item of resposta.cobertura) {
    if (!campos.includes(item.campo)) continue
    const primeiro = interpretarPeriodoPecuaria(item.primeiro_periodo)
    const ultimo = interpretarPeriodoPecuaria(item.ultimo_periodo)
    cobertura[item.campo] = {
      primeiro: primeiro?.periodo ?? null,
      ultimo: ultimo?.periodo ?? null,
      quantidade: Number(item.total_registros ?? 0)
    }
  }
  return { dados, cobertura }
}

export function periodoAnterior(periodo, deslocamentoMeses = 1) {
  const data = interpretarPeriodoPecuaria(periodo)
  if (!data) return null
  const d = new Date(Date.UTC(data.ano, data.mes - 1 - deslocamentoMeses, 1))
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function obterSerieIndicador(dados, cobertura, campo, ano = 'todos') {
  const intervalo = cobertura[campo]
  if (!intervalo?.primeiro || !intervalo?.ultimo) return []
  return dados
    .filter((d) => d.periodo >= intervalo.primeiro && d.periodo <= intervalo.ultimo)
    .filter((d) => ano === 'todos' || d.ano === Number(ano))
    .map((d) => ({ ...d, valor: d.valores[campo] }))
}

export function anosDoIndicador(dados, cobertura, campo) {
  return [...new Set(obterSerieIndicador(dados, cobertura, campo).filter((d) => d.valor !== null).map((d) => d.ano))].sort((a, b) => a - b)
}

export function analisarIndicador(dados, cobertura, campo, ano = 'todos') {
  const serie = obterSerieIndicador(dados, cobertura, campo, ano)
  const validos = serie.filter((d) => d.valor !== null)
  const ultimo = validos.at(-1) ?? null
  const maior = validos.reduce((acc, d) => !acc || d.valor > acc.valor ? d : acc, null)
  const menor = validos.reduce((acc, d) => !acc || d.valor < acc.valor ? d : acc, null)
  const mapa = new Map(dados.map((d) => [d.periodo, d]))
  const referenciaMensal = ultimo ? mapa.get(periodoAnterior(ultimo.periodo, 1)) ?? null : null
  const referenciaAnual = ultimo ? mapa.get(periodoAnterior(ultimo.periodo, 12)) ?? null : null
  const anterior = referenciaMensal?.valores?.[campo] ?? null
  const anteriorAno = referenciaAnual?.valores?.[campo] ?? null
  const diferencaMensal = ultimo && anterior !== null ? ultimo.valor - anterior : null
  const diferencaAnual = ultimo && anteriorAno !== null ? ultimo.valor - anteriorAno : null
  const variacaoMensal = diferencaMensal !== null && anterior !== 0 ? diferencaMensal / Math.abs(anterior) * 100 : null
  const variacaoAnual = diferencaAnual !== null && anteriorAno !== 0 ? diferencaAnual / Math.abs(anteriorAno) * 100 : null
  let altas = 0, quedas = 0, estaveis = 0, pares = 0
  for (const d of validos) {
    const mesAnterior = mapa.get(periodoAnterior(d.periodo, 1))
    const base = mesAnterior?.valores?.[campo]
    if (base === null || base === undefined) continue
    if (ano !== 'todos' && String(mesAnterior.ano) !== String(ano)) continue
    pares += 1
    if (d.valor > base) altas++
    else if (d.valor < base) quedas++
    else estaveis++
  }
  return {
    serie, validos, ultimo, maior, menor,
    ausentes: serie.length - validos.length,
    diferencaMensal, diferencaAnual, variacaoMensal, variacaoAnual,
    referenciaMensal: referenciaMensal && anterior !== null ? referenciaMensal : null,
    referenciaAnual: referenciaAnual && anteriorAno !== null ? referenciaAnual : null,
    altas, quedas, estaveis, pares
  }
}

export function comparacaoAnualPecuaria(dados, cobertura, campo, ano) {
  const anos = anosDoIndicador(dados, cobertura, campo)
  const escolhidos = ano === 'todos'
    ? anos
    : [Number(ano) - 1, Number(ano)].filter((x) => anos.includes(x))
  const mapa = new Map(obterSerieIndicador(dados, cobertura, campo).map((d) => [d.periodo, d.valor]))
  const linhas = MESES_PECUARIA.map((mes, index) => {
    const linha = { mes }
    escolhidos.forEach((a) => {
      linha[`ano_${a}`] = mapa.get(`${a}${String(index + 1).padStart(2, '0')}`) ?? null
    })
    return linha
  })
  return { anos: escolhidos, linhas }
}
