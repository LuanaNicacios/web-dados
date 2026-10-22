// Análises descritivas do IPCA. Funções puras: não consultam o banco.
// Diferencas são aritméticas NA ESCALA DE ORIGEM (unidade não validada).
// Não interpretar como variação percentual, taxa acumulada ou causalidade.

function numero(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null
}

export function mesAnterior(codigo) {
  const texto = String(codigo ?? '')
  if (!/^\d{6}$/.test(texto)) return null
  const ano = Number(texto.slice(0, 4))
  const mes = Number(texto.slice(4, 6))
  if (mes < 1 || mes > 12) return null
  return mes === 1 ? `${ano - 1}12` : `${ano}${String(mes - 1).padStart(2, '0')}`
}

export function mesmoMesAnoAnterior(codigo) {
  const texto = String(codigo ?? '')
  if (!/^\d{6}$/.test(texto)) return null
  const ano = Number(texto.slice(0, 4))
  const mes = Number(texto.slice(4, 6))
  return mes < 1 || mes > 12 ? null : `${ano - 1}${texto.slice(4)}`
}

function comparar(registro, codigoReferencia, historico, indicador) {
  if (!registro || !codigoReferencia) return null
  const base = historico.get(codigoReferencia)
  const a = numero(registro.valores?.[indicador])
  const b = numero(base?.valores?.[indicador])
  if (a === null || b === null) return null
  return {
    atual: registro.periodo,
    anterior: base.periodo,
    rotuloAnterior: base.extenso,
    diferenca: a - b,
    valorAtual: a,
    valorAnterior: b
  }
}

export function analisarIpca(dados = [], campo = 'indice_geral', ano = 'todos') {
  const ordenados = [...dados].sort((a, b) => String(a.periodo).localeCompare(String(b.periodo)))
  const historico = new Map(ordenados.map((registro) => [registro.periodo, registro]))
  const selecionados = ordenados.filter((d) => ano === 'todos' || d.ano === Number(ano))
  const serie = selecionados.map((d) => ({ ...d, valor: numero(d.valores?.[campo]) }))
  const validos = serie.filter((d) => d.valor !== null)
  const ultimo = validos.at(-1) ?? null
  const maior = validos.reduce((a, b) => !a || b.valor > a.valor ? b : a, null)
  const menor = validos.reduce((a, b) => !a || b.valor < a.valor ? b : a, null)

  const mensal = comparar(ultimo, mesAnterior(ultimo?.periodo), historico, campo)
  const interanual = comparar(ultimo, mesmoMesAnoAnterior(ultimo?.periodo), historico, campo)

  // Contagem de movimentos compara SOMENTE meses calendário consecutivos
  // que também estejam no recorte exibido; nunca pula lacunas.
  const noFiltro = new Map(serie.map((d) => [d.periodo, d]))
  const movimentos = { altas: 0, quedas: 0, estaveis: 0, comparaveis: 0 }
  for (const d of serie) {
    const anterior = noFiltro.get(mesAnterior(d.periodo))
    if (!anterior || d.valor === null || anterior.valor === null) continue
    movimentos.comparaveis += 1
    if (d.valor > anterior.valor) movimentos.altas += 1
    else if (d.valor < anterior.valor) movimentos.quedas += 1
    else movimentos.estaveis += 1
  }

  const sinais = {
    positivos: validos.filter((d) => d.valor > 0).length,
    negativos: validos.filter((d) => d.valor < 0).length,
    zeros: validos.filter((d) => d.valor === 0).length
  }

  // Ausência de valor num registro e ausência do registro inteiro são coisas distintas.
  const mesesSemValor = serie.length - validos.length
  const anosParciais = [...new Set(serie.map((d) => d.ano))]
    .filter((a) => serie.filter((d) => d.ano === a).length < 12)

  let mesesSemRegistro = 0
  if (serie.length > 1) {
    const inicio = Number(serie[0].periodo.slice(0, 4)) * 12 + Number(serie[0].periodo.slice(4, 6))
    const fim = Number(serie.at(-1).periodo.slice(0, 4)) * 12 + Number(serie.at(-1).periodo.slice(4, 6))
    mesesSemRegistro = Math.max(0, fim - inicio + 1 - serie.length)
  }

  return {
    serie, validos, ultimo, maior, menor, mensal, interanual,
    movimentos, sinais, mesesSemValor, mesesSemRegistro, anosParciais
  }
}
