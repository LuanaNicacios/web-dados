import { fetchApiProtegida } from '../../../../services/apiProtegida'
import React, { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import './DashboardComercio.css'
import './DashboardComercioDestaques.css'
import {
  analisarComercio,
  descreverComparacaoIndice,
  formatarNumeroComercio
} from './analisesComercio.mjs'

// Exclusivamente local até que autenticação e infraestrutura sejam revisadas.
const API_URL = 'http://127.0.0.1:3001/api/comercio'
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const CORES = ['#2563eb', '#059669', '#d97706', '#9333ea', '#db2777', '#0891b2']

function interpretarPeriodo(valor) {
  const periodo = String(valor ?? '').trim()
  if (!/^\d{6}$/.test(periodo)) return null
  const ano = Number(periodo.slice(0, 4))
  const mes = Number(periodo.slice(4, 6))
  if (ano < 1900 || ano > 2200 || mes < 1 || mes > 12) return null
  return {
    periodo,
    ano,
    mes,
    mesLabel: `${MESES[mes - 1]}/${String(ano).slice(-2)}`,
    periodoLabel: `${MESES[mes - 1]}/${ano}`
  }
}

function interpretarIndice(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return null
  const texto = String(valor).trim().replace(',', '.')
  if (!/^-?\d+(?:\.\d+)?$/.test(texto)) return null
  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : null
}

function DetalheComparacao({ titulo, comparacao, legenda }) {
  const tipo = !comparacao ? 'neutro' : comparacao.pontos > 0 ? 'positivo' : comparacao.pontos < 0 ? 'negativo' : 'neutro'
  return (
    <article className={`comercio-destaque comercio-destaque--${tipo}`}>
      <div className="comercio-destaque-titulo">{titulo}</div>
      <div className="comercio-destaque-valor">
        {comparacao ? `${comparacao.pontos > 0 ? '+' : ''}${formatarNumeroComercio(comparacao.pontos)} pontos` : 'Indisponível'}
      </div>
      <p>{descreverComparacaoIndice(comparacao)}</p>
      {legenda && <small>{legenda}</small>}
    </article>
  )
}

export default function DashboardComercio() {
  const [registros, setRegistros] = useState([])
  const [anoSelecionado, setAnoSelecionado] = useState('todos')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [atualizacao, setAtualizacao] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function carregar() {
      setCarregando(true)
      setErro('')
      if (!import.meta.env.DEV) {
        setErro('Este painel está disponível somente no ambiente local de desenvolvimento.')
        setCarregando(false)
        return
      }
      try {
        const resposta = await fetchApiProtegida(API_URL, { cache: 'no-store', signal: controller.signal })
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        const conteudo = await resposta.json()
        if (conteudo.status !== 'sucesso' || !Array.isArray(conteudo.dados)) {
          throw new Error('Resposta inesperada da API')
        }
        const vistos = new Set()
        const dados = []
        for (const linha of conteudo.dados) {
          const periodo = interpretarPeriodo(linha.periodo)
          if (!periodo || vistos.has(periodo.periodo)) {
            throw new Error('A API retornou um período inválido ou repetido')
          }
          vistos.add(periodo.periodo)
          dados.push({ ...periodo, valor: interpretarIndice(linha.indice_vendas) })
        }
        dados.sort((a, b) => a.periodo.localeCompare(b.periodo))
        if (!dados.length) throw new Error('Nenhum período disponível')
        if (!controller.signal.aborted) setRegistros(dados)
      } catch (falha) {
        if (controller.signal.aborted) return
        console.error('Erro ao carregar índice de comércio:', falha.message)
        setErro('Não foi possível consultar o índice de comércio. Confira a VPN, a API na porta 3001 e a rota /api/comercio.')
      } finally {
        if (!controller.signal.aborted) setCarregando(false)
      }
    }
    carregar()
    return () => controller.abort()
  }, [atualizacao])

  const anos = useMemo(
    () => [...new Set(registros.map((item) => item.ano))].sort((a, b) => a - b),
    [registros]
  )
  const filtrados = useMemo(
    () => registros.filter((item) => anoSelecionado === 'todos' || item.ano === Number(anoSelecionado)),
    [registros, anoSelecionado]
  )
  const comValores = useMemo(() => filtrados.filter((item) => item.valor !== null), [filtrados])
  const analise = useMemo(() => analisarComercio(registros, filtrados), [registros, filtrados])

  // O gráfico comparativo mantém todos os anos, como na versão anterior.
  const comparacao = useMemo(() => {
    const linhas = Array.from({ length: 12 }, (_, i) => ({ mes: MESES[i], numeroMes: i + 1 }))
    for (const registro of registros) linhas[registro.mes - 1][String(registro.ano)] = registro.valor
    return linhas
  }, [registros])

  const anosParciais = useMemo(() => anos.filter(
    (ano) => registros.filter((item) => item.ano === ano).length < 12
  ), [anos, registros])

  return (
    <section className="comercio-dashboard" aria-labelledby="comercio-titulo">
      <div className="comercio-cabecalho">
        <div>
          <span className="comercio-etiqueta">Demonstração local — PostgreSQL</span>
          <h2 id="comercio-titulo">Indicadores do Comércio Varejista</h2>
          <p>Índice de volume de vendas no comércio varejista, consultado diretamente no banco.</p>
        </div>
        <button className="comercio-botao" type="button" disabled={carregando} onClick={() => setAtualizacao((atual) => atual + 1)}>
          {carregando ? 'Consultando...' : 'Atualizar dados'}
        </button>
      </div>

      <p className="comercio-aviso">
        Fonte: PostgreSQL — <strong>pib.pmc_volume</strong>. Os números representam um índice,
        não valores em reais ou percentuais. A base de referência e a metodologia serão validadas pela equipe de dados.
      </p>

      {erro && <p role="alert" className="comercio-erro">{erro}</p>}
      {carregando && <p className="comercio-mensagem">Consultando o banco de dados...</p>}

      {!carregando && !erro && (
        <>
          <div className="comercio-filtros">
            <label htmlFor="comercio-ano">Ano (evolução mensal, tabela e destaques)</label>
            <select id="comercio-ano" value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)}>
              <option value="todos">Todos os anos</option>
              {anos.map((ano) => <option key={ano} value={String(ano)}>{ano}</option>)}
            </select>
          </div>

          <div className="comercio-cards">
            <div><span>Meses com registros</span><strong>{filtrados.length}</strong></div>
            <div><span>Último índice disponível</span><strong>{formatarNumeroComercio(analise?.ultimo.valor)}</strong><small>{analise?.ultimo.periodoLabel ?? '—'}</small></div>
            <div><span>Menor índice</span><strong>{formatarNumeroComercio(analise?.minimo.valor)}</strong></div>
            <div><span>Maior índice</span><strong>{formatarNumeroComercio(analise?.maximo.valor)}</strong></div>
          </div>

          <section className="comercio-painel-destaques" aria-labelledby="comercio-destaques-titulo">
            <div className="comercio-destaques-cabecalho">
              <div>
                <span className="comercio-destaques-kicker">LEITURA DOS INDICADORES</span>
                <h3 id="comercio-destaques-titulo">Destaques do período selecionado</h3>
                <p>Resumo automático baseado exclusivamente nos registros disponíveis e no filtro aplicado.</p>
              </div>
            </div>

            {analise ? (
              <div className="comercio-destaques-grid">
                <DetalheComparacao
                  titulo="Variação em relação ao mês anterior"
                  comparacao={analise.mensal}
                  legenda="Comparação com o mês imediatamente anterior do histórico, quando disponível."
                />
                <DetalheComparacao
                  titulo="Variação interanual"
                  comparacao={analise.interanual}
                  legenda="Comparação com o mesmo mês do ano anterior, quando disponível."
                />
                <article className="comercio-destaque comercio-destaque--azul">
                  <div className="comercio-destaque-titulo">Extremos do período filtrado</div>
                  <div className="comercio-destaque-valor">{formatarNumeroComercio(analise.minimo.valor)} a {formatarNumeroComercio(analise.maximo.valor)}</div>
                  <p>Menor índice em <strong>{analise.minimo.periodoLabel}</strong> e maior em <strong>{analise.maximo.periodoLabel}</strong>.</p>
                  <small>Valores do índice, não montantes financeiros.</small>
                </article>
                <article className="comercio-destaque comercio-destaque--azul">
                  <div className="comercio-destaque-titulo">Movimentação mensal no período</div>
                  <div className="comercio-destaque-valor">{analise.movimentos.altas} altas · {analise.movimentos.quedas} quedas</div>
                  <p>Foram {analise.movimentos.comparacoes} comparações entre meses consecutivos dentro do filtro, com {analise.movimentos.estaveis} sem mudança.</p>
                  <small>{analise.registrosSemValor > 0 ? `${analise.registrosSemValor} registro(s) sem valor numérico.` : 'Nenhum valor ausente nos meses selecionados.'}</small>
                </article>
              </div>
            ) : <p className="comercio-mensagem">Não há registros numéricos suficientes para gerar destaques.</p>}

            <p className="comercio-destaques-nota">
              <strong>Como interpretar:</strong> a diferença entre dois valores é medida em pontos do índice.
              A porcentagem apresentada nas comparações é calculada em relação ao índice de referência;
              não significa que o índice seja, por si só, um percentual. Comparações mês a mês não pressupõem ajuste sazonal.
              As comparações do último mês podem utilizar o período de referência de outro ano, mesmo quando um ano está selecionado.
            </p>
          </section>

          <div className="comercio-card-grafico">
            <h3>Evolução mensal — Volume de vendas</h3>
            <p>O filtro de ano atua neste gráfico, nos destaques e na tabela.</p>
            {comValores.length ? (
              <div className="comercio-grafico" role="img" aria-label="Gráfico de evolução mensal do índice de volume de vendas">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filtrados} margin={{ top: 8, right: 24, left: 0, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mesLabel" minTickGap={22} tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatarNumeroComercio} width={58} tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                    <Tooltip labelFormatter={(_label, itens) => itens?.[0]?.payload?.periodoLabel ?? _label} formatter={(valor) => [formatarNumeroComercio(valor), 'Índice de vendas']} />
                    <Line type="linear" dataKey="valor" stroke="#2563eb" strokeWidth={2.5} dot={filtrados.length <= 24} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="comercio-mensagem">Não há valores disponíveis para o período selecionado.</p>}
          </div>

          <div className="comercio-card-grafico">
            <h3>Comparação mensal entre anos</h3>
            <p>Comparação do mesmo índice em cada mês. Este gráfico inclui todos os anos disponíveis.</p>
            <div className="comercio-grafico" role="img" aria-label="Comparação do índice de vendas entre anos">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparacao} margin={{ top: 8, right: 24, left: 0, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatarNumeroComercio} width={58} tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip formatter={(valor, nome) => [formatarNumeroComercio(valor), `Ano ${nome}`]} />
                  <Legend verticalAlign="bottom" height={28} />
                  {anos.map((ano, indice) => (
                    <Line
                      key={ano}
                      name={String(ano)}
                      type="linear"
                      dataKey={String(ano)}
                      stroke={CORES[indice % CORES.length]}
                      strokeWidth={2}
                      connectNulls={false}
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {anosParciais.length > 0 && (
              <p className="comercio-observacao">Séries incompletas: {anosParciais.join(', ')}. Meses sem registro não são tratados como zero.</p>
            )}
          </div>

          <div className="comercio-card-tabela">
            <h3>Valores por mês</h3>
            <div className="comercio-tabela-scroll">
              <table>
                <thead><tr><th>Período</th><th>Índice de volume de vendas</th></tr></thead>
                <tbody>
                  {filtrados.map((linha) => (
                    <tr key={linha.periodo}>
                      <td>{linha.periodoLabel}</td>
                      <td>{formatarNumeroComercio(linha.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
