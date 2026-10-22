// Cálculos puramente descritivos. Não infere causalidade ou prevê resultados.
// Recebe séries JÁ filtradas pelo dashboard e não preenche meses ausentes.

export function criarAnalisesMercadoTrabalho({ evolucao = [], porSecao = [], resumo = null, secaoSelecionada = 'todas' }) {
  if (!evolucao.length || !resumo) return null

  const ordenados = [...evolucao].sort((a, b) => a.mesCodigo.localeCompare(b.mesCodigo))
  const maior = (dados, campo) => dados.reduce((atual, item) => item[campo] > atual[campo] ? item : atual)
  const menor = (dados, campo) => dados.reduce((atual, item) => item[campo] < atual[campo] ? item : atual)
  const periodoInicial = ordenados[0]
  const periodoFinal = ordenados[ordenados.length - 1]

  const maiorAdmissao = maior(ordenados, 'admitidos')
  const maiorDesligamento = maior(ordenados, 'desligados')
  const maiorSaldoMensal = maior(ordenados, 'saldo')
  const menorSaldoMensal = menor(ordenados, 'saldo')
  const maiorSaldoSecao = porSecao.length ? maior(porSecao, 'saldo') : null
  const menorSaldoSecao = porSecao.length ? menor(porSecao, 'saldo') : null

  return {
    saldo: resumo.saldo,
    naturezaSaldo: resumo.saldo > 0 ? 'positivo' : resumo.saldo < 0 ? 'negativo' : 'nulo',
    maiorAdmissao,
    maiorDesligamento,
    maiorSaldoMensal,
    menorSaldoMensal,
    maiorSaldoSecao,
    menorSaldoSecao,
    periodoInicial,
    periodoFinal,
    diferencaSaldoExtremos: ordenados.length > 1 ? periodoFinal.saldo - periodoInicial.saldo : null,
    compararSecoes: secaoSelecionada === 'todas' && porSecao.length > 1,
    mesesComRegistro: ordenados.length,
    secoesRepresentadas: porSecao.length
  }
}
