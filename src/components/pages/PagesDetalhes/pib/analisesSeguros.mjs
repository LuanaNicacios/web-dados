// Cálculos descritivos apenas; não inferem sinistralidade nem unidades monetárias.
export const NOMES_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function normalizarSeguros(resposta) {
  if (resposta?.status !== 'sucesso' || !Array.isArray(resposta.dados)) {
    throw new Error('Formato de resposta inesperado')
  }
  const vistos = new Set()
  return resposta.dados.map((linha) => {
    const periodo = String(linha.periodo ?? '')
    if (!/^\d{6}$/.test(periodo) || vistos.has(periodo)) {
      throw new Error('Período inválido ou duplicado')
    }
    const ano = Number(periodo.slice(0, 4))
    const mes = Number(periodo.slice(4, 6))
    if (ano < 1900 || ano > 2200 || mes < 1 || mes > 12) {
      throw new Error('Ano ou mês inválido')
    }
    vistos.add(periodo)
    const numero = (v) => {
      if (v === null || v === undefined || String(v).trim() === '') return null
      const n = Number(v)
      if (!Number.isFinite(n)) throw new Error('Valor numérico inválido')
      return n
    }
    return {
      periodo,
      ano,
      mes,
      rotulo: `${NOMES_MESES[mes - 1]}/${String(ano).slice(-2)}`,
      extenso: `${NOMES_MESES[mes - 1]}/${ano}`,
      premio: numero(linha.premio),
      sinistro: numero(linha.sinistro)
    }
  }).sort((a, b) => a.periodo.localeCompare(b.periodo))
}

export function mesAnterior(periodo) {
  const ano = Number(periodo.slice(0, 4))
  const mes = Number(periodo.slice(4, 6))
  const anterior = mes === 1 ? `${ano - 1}12` : `${ano}${String(mes - 1).padStart(2, '0')}`
  return anterior
}

export function anoAnterior(periodo) {
  return `${Number(periodo.slice(0, 4)) - 1}${periodo.slice(4, 6)}`
}

function extremos(linhas, campo, teste) {
  const disponiveis = linhas.filter((r) => r[campo] !== null)
  return disponiveis.reduce((acc, atual) => (!acc || teste(atual[campo], acc[campo]) ? atual : acc), null)
}

export function obterResumoSeguros(historico, selecionados) {
  const validos = [...selecionados].sort((a, b) => a.periodo.localeCompare(b.periodo))
  const mapa = new Map(historico.map((item) => [item.periodo, item]))
  const ultimoPremio = [...validos].reverse().find((x) => x.premio !== null) ?? null
  const ultimoSinistro = [...validos].reverse().find((x) => x.sinistro !== null) ?? null
  const comparar = (ultima, campo, periodoReferencia) => {
    if (!ultima) return null
    const referencia = mapa.get(periodoReferencia(ultima.periodo))
    if (!referencia || referencia[campo] === null) return null
    return {
      referencia: referencia.extenso,
      valorReferencia: referencia[campo],
      diferenca: ultima[campo] - referencia[campo]
    }
  }
  return {
    totalMeses: validos.length,
    primeiro: validos[0] ?? null,
    ultimo: validos.at(-1) ?? null,
    ultimoPremio,
    ultimoSinistro,
    premioMin: extremos(validos, 'premio', (a, b) => a < b),
    premioMax: extremos(validos, 'premio', (a, b) => a > b),
    sinistroMin: extremos(validos, 'sinistro', (a, b) => a < b),
    sinistroMax: extremos(validos, 'sinistro', (a, b) => a > b),
    premioMensal: comparar(ultimoPremio, 'premio', mesAnterior),
    premioInteranual: comparar(ultimoPremio, 'premio', anoAnterior),
    sinistroMensal: comparar(ultimoSinistro, 'sinistro', mesAnterior),
    sinistroInteranual: comparar(ultimoSinistro, 'sinistro', anoAnterior),
    premiosNegativos: validos.filter((r) => r.premio !== null && r.premio < 0),
    sinistrosNegativos: validos.filter((r) => r.sinistro !== null && r.sinistro < 0),
    premiosAusentes: validos.filter((r) => r.premio === null).length,
    sinistrosAusentes: validos.filter((r) => r.sinistro === null).length
  }
}
