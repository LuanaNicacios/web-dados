// Utilitários comuns aos indicadores do schema pib.
// Não convertem valores ausentes em zero nem atribuem unidade não validada.
export const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function formatarValor(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return 'Sem informação'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(valor)
}

export function lerPeriodo(codigo, frequencia) {
  const texto = String(codigo ?? '')
  if (!/^\d{6}$/.test(texto)) return null
  const ano = Number(texto.slice(0, 4))
  const parte = Number(texto.slice(4))
  if (ano < 1900 || ano > 2200) return null
  if (frequencia === 'mensal') {
    if (parte < 1 || parte > 12) return null
    return { ano, parte, rotulo: `${MESES[parte - 1]}/${String(ano).slice(-2)}`, extenso: `${MESES[parte - 1]}/${ano}` }
  }
  if (frequencia === 'trimestral') {
    if (parte < 1 || parte > 4) return null
    return { ano, parte, rotulo: `${parte}º tri/${String(ano).slice(-2)}`, extenso: `${parte}º trimestre de ${ano}` }
  }
  return null
}

export function validarResposta(conteudo, frequencia, campos) {
  if (conteudo?.status !== 'sucesso' || conteudo.frequencia !== frequencia ||
      !Array.isArray(conteudo.dados) || !Array.isArray(conteudo.indicadores)) {
    throw new Error('Estrutura de resposta da API incompatível')
  }
  const indicadores = conteudo.indicadores
  const chaves = new Set()
  for (const indicador of indicadores) {
    if (typeof indicador.campo !== 'string' || typeof indicador.nome !== 'string' || chaves.has(indicador.campo)) {
      throw new Error('Metadados de indicadores inválidos')
    }
    chaves.add(indicador.campo)
  }
  const periodos = new Set()
  const dados = conteudo.dados.map((item) => {
    const data = lerPeriodo(item.periodo, frequencia)
    if (!data || periodos.has(item.periodo)) throw new Error('Período inválido ou duplicado')
    periodos.add(item.periodo)
    for (const campo of campos) {
      const valores = item[campo]
      if (valores !== null && (typeof valores !== 'object' || Array.isArray(valores))) {
        throw new Error('Valores de indicadores inválidos')
      }
      if (valores !== null) {
        for (const indicador of indicadores) {
          const numero = valores[indicador.campo]
          if (numero !== null && numero !== undefined && (typeof numero !== 'number' || !Number.isFinite(numero))) {
            throw new Error('Valor numérico inesperado')
          }
        }
      }
    }
    return { ...item, ...data }
  }).sort((a, b) => a.periodo.localeCompare(b.periodo))
  return { indicadores, dados }
}

export function selecionarNumero(valores, chave) {
  const valor = valores?.[chave]
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null
}

export function deltaTexto(atual, anterior) {
  if (atual === null || anterior === null) return 'Sem comparação disponível'
  const delta = atual - anterior
  return `${delta > 0 ? '+' : ''}${formatarValor(delta)}`
}

export const CORES_ANOS = ['#2563eb', '#0891b2', '#0f766e', '#f59e0b', '#8b5cf6', '#be185d', '#475569', '#b45309', '#4f46e5', '#15803d']

export const tooltipNumerico = (valor) => formatarValor(typeof valor === 'number' ? valor : null)
