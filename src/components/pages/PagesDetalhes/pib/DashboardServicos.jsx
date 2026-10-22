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
import './DashboardServicos.css'
import './DashboardServicosDestaques.css'
import { analisarServicos, descreverVariacaoServicos, formatarNumeroServicos } from './analisesServicos.mjs'

// Apenas desenvolvimento local. A implantação interna terá uma URL/API autorizada.
const API_URL = 'http://127.0.0.1:3001/api/servicos'
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const CORES = ['#2563eb', '#059669', '#d97706', '#9333ea', '#db2777', '#0891b2']

const formatarIndice = (valor) => (
  valor === null || valor === undefined
    ? 'Sem informação'
    : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(valor)
)

function analisarPeriodo(valor) {
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

function analisarNumero(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return null
  const texto = String(valor).trim().replace(',', '.')
  if (!/^-?\d+(?:\.\d+)?$/.test(texto)) return null
  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : null
}

export default function DashboardServicos() {
  const [registros, setRegistros] = useState([])
  const [indicadores, setIndicadores] = useState([])
  const [indicador, setIndicador] = useState('total')
  const [anoSelecionado, setAnoSelecionado] = useState('todos')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [atualizacao, setAtualizacao] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function carregarDados() {
      setErro('')
      setCarregando(true)

      // Nunca consultar a rede institucional a partir da build pública do GitHub Pages.
      if (!import.meta.env.DEV) {
        setErro('Esta análise está disponível somente no ambiente local de desenvolvimento.')
        setCarregando(false)
        return
      }

      try {
        const resposta = await fetchApiProtegida(API_URL, {
          cache: 'no-store',
          signal: controller.signal
        })
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)

        const conteudo = await resposta.json()
        if (conteudo.status !== 'sucesso' || !Array.isArray(conteudo.dados) || !Array.isArray(conteudo.indicadores)) {
          throw new Error('Resposta inesperada da API')
        }

        const lista = conteudo.indicadores.filter((item) => (
          typeof item.campo === 'string' && typeof item.nome === 'string'
        ))
        if (!lista.length) throw new Error('Nenhum indicador retornado')
        const vistos = new Set()
        const convertidos = conteudo.dados.map((linha) => {
          const periodo = analisarPeriodo(linha.periodo)
          if (!periodo || vistos.has(periodo.periodo)) {
            throw new Error('Período inválido ou repetido')
          }
          vistos.add(periodo.periodo)
          const valores = Object.fromEntries(
            lista.map(({ campo }) => [campo, analisarNumero(linha.valores?.[campo])])
          )
          return { ...periodo, valores }
        })
        if (!convertidos.length) throw new Error('Nenhum registro retornado')
        convertidos.sort((a, b) => a.periodo.localeCompare(b.periodo))

        if (!controller.signal.aborted) {
          setRegistros(convertidos)
          setIndicadores(lista)
          setIndicador((atual) => lista.some((item) => item.campo === atual)
            ? atual : (lista.some((item) => item.campo === 'total') ? 'total' : lista[0].campo))
        }
      } catch (falha) {
        if (controller.signal.aborted) return
        console.error('Falha ao consultar serviços:', falha.message)
        setErro('Não foi possível consultar os indicadores de serviços. Confira a VPN, a API na porta 3001 e a rota /api/servicos.')
      } finally {
        if (!controller.signal.aborted) setCarregando(false)
      }
    }

    carregarDados()
    return () => controller.abort()
  }, [atualizacao])

  const nomeIndicador = indicadores.find((item) => item.campo === indicador)?.nome ?? 'Indicador'

  const anosDisponiveis = useMemo(
    () => [...new Set(registros.map((linha) => linha.ano))].sort((a, b) => a - b),
    [registros]
  )

  const dadosFiltrados = useMemo(
    () => registros
      .filter((linha) => anoSelecionado === 'todos' || linha.ano === Number(anoSelecionado))
      .map((linha) => ({ ...linha, valor: linha.valores[indicador] ?? null })),
    [registros, anoSelecionado, indicador]
  )

  const dadosValidos = dadosFiltrados.filter((linha) => linha.valor !== null)
  const ultimo = dadosValidos.at(-1) ?? null
  const minimo = dadosValidos.length ? Math.min(...dadosValidos.map((linha) => linha.valor)) : null
  const maximo = dadosValidos.length ? Math.max(...dadosValidos.map((linha) => linha.valor)) : null

  // Uma curva por ano; ausência de informação continua como null, nunca como zero.
  const dadosComparacao = useMemo(() => {
    const meses = Array.from({ length: 12 }, (_, i) => ({ mes: MESES[i], numeroMes: i + 1 }))
    for (const linha of registros) {
      meses[linha.mes - 1][String(linha.ano)] = linha.valores[indicador] ?? null
    }
    return meses
  }, [registros, indicador])

  const anosIncompletos = useMemo(() => anosDisponiveis.filter(
    (ano) => registros.filter((linha) => linha.ano === ano).length < 12
  ), [anosDisponiveis, registros])

  const destaques = useMemo(
    () => analisarServicos(registros, dadosFiltrados, indicador),
    [registros, dadosFiltrados, indicador]
  )

  const existeAlgumValor = registros.some((linha) => linha.valores[indicador] !== null)

  return (
    <section className="servicos-dashboard" aria-labelledby="servicos-titulo">
      <div className="servicos-cabecalho">
        <div>
          <span className="servicos-etiqueta">Demonstração local — PostgreSQL</span>
          <h2 id="servicos-titulo">Indicadores do Setor de Serviços</h2>
          <p>Séries mensais das atividades de serviços, consultadas diretamente no banco.</p>
        </div>
        <button
          type="button"
          className="servicos-botao"
          onClick={() => setAtualizacao((atual) => atual + 1)}
          disabled={carregando}
        >
          {carregando ? 'Consultando...' : 'Atualizar dados'}
        </button>
      </div>

      <p className="servicos-aviso">
        Fonte: PostgreSQL — <strong>pib.pms_volume</strong>. Os valores são índices, não valores em reais.
        A base de referência, a metodologia e a comparabilidade das séries ainda precisam ser confirmadas com a equipe de dados.
      </p>

      {erro && <p className="servicos-erro" role="alert">{erro}</p>}
      {carregando && <p className="servicos-mensagem">Consultando os dados do PostgreSQL...</p>}

      {!carregando && !erro && (
        <>
          <div className="servicos-filtros">
            <label>
              Indicador
              <select value={indicador} onChange={(evento) => setIndicador(evento.target.value)}>
                {indicadores.map((item) => (
                  <option key={item.campo} value={item.campo}>{item.nome}</option>
                ))}
              </select>
            </label>
            <label>
              Ano (evolução mensal e tabela)
              <select value={anoSelecionado} onChange={(evento) => setAnoSelecionado(evento.target.value)}>
                <option value="todos">Todos os anos</option>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={String(ano)}>{ano}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="servicos-cards">
            <div><span>Meses com registros</span><strong>{dadosFiltrados.length}</strong></div>
            <div><span>Último valor disponível</span><strong>{formatarIndice(ultimo?.valor)}</strong><small>{ultimo?.periodoLabel ?? '—'}</small></div>
            <div><span>Menor índice</span><strong>{formatarIndice(minimo)}</strong></div>
            <div><span>Maior índice</span><strong>{formatarIndice(maximo)}</strong></div>
          </div>

          <section className="servicos-destaques" aria-labelledby="servicos-destaques-titulo">
            <header className="servicos-destaques-cabecalho">
              <h3 id="servicos-destaques-titulo">Destaques da análise</h3>
              <p>
                Indicador: <strong>{nomeIndicador}</strong> ·
                {' '}{anoSelecionado === 'todos' ? 'Todos os anos disponíveis' : `Ano ${anoSelecionado}`}.
                As comparações usam a mesma série de índice.
              </p>
            </header>

            {destaques.ultimo ? (
              <>
                <div className="servicos-destaques-grid">
                  <div className="servicos-destaque-card">
                    <span className="servicos-destaque-label">Último valor do filtro</span>
                    <strong>{formatarNumeroServicos(destaques.ultimo.valor)}</strong>
                    <small>{destaques.ultimo.periodoLabel}</small>
                  </div>
                  <div className="servicos-destaque-card">
                    <span className="servicos-destaque-label">Menor valor do filtro</span>
                    <strong>{formatarNumeroServicos(destaques.minimo?.valor)}</strong>
                    <small>{destaques.minimo?.periodoLabel}</small>
                  </div>
                  <div className="servicos-destaque-card">
                    <span className="servicos-destaque-label">Maior valor do filtro</span>
                    <strong>{formatarNumeroServicos(destaques.maximo?.valor)}</strong>
                    <small>{destaques.maximo?.periodoLabel}</small>
                  </div>
                  <div className="servicos-destaque-card" >
                    <span className="servicos-destaque-label">Meses com índice disponível</span>
                    <strong>{destaques.mesesComValor} / {destaques.mesesComRegistro}</strong>
                    <small>Meses registrados no intervalo escolhido</small>
                  </div>
                </div>
                <div className="servicos-destaques-leituras">
                  <article className="servicos-destaques-leitura">
                    <h4>Variação em relação ao mês anterior</h4>
                    <p>{descreverVariacaoServicos(destaques.mensal)}</p>
                  </article>
                  <article className="servicos-destaques-leitura">
                    <h4>Comparação com o mesmo mês do ano anterior</h4>
                    <p>{descreverVariacaoServicos(destaques.interanual)}</p>
                  </article>
                  <article className="servicos-destaques-leitura">
                    <h4>Comportamento dentro do período filtrado</h4>
                    <p>
                      Nas {destaques.movimentos.comparacoes} comparações entre meses consecutivos
                      com valores disponíveis, houve {destaques.movimentos.altas} alta(s),
                      {' '}{destaques.movimentos.quedas} queda(s) e
                      {' '}{destaques.movimentos.estaveis} ocorrência(s) de estabilidade.
                    </p>
                  </article>
                  <article className="servicos-destaques-leitura atencao">
                    <h4>Pontos de atenção</h4>
                    <p>
                      {destaques.valoresAusentes > 0
                        ? `${destaques.valoresAusentes} mês(es) com registro, mas sem valor numérico para o indicador. `
                        : 'Nenhum valor vazio entre os meses registrados no período filtrado. '}
                      As variações são descritivas, sem ajuste sazonal confirmado.
                      A base de referência e a metodologia dos índices ainda precisam de validação.
                      Os resultados não são valores em reais nem participação percentual do setor.
                    </p>
                  </article>
                </div>
              </>
            ) : (
              <div className="servicos-destaques-leitura atencao">
                <h4>Sem dados suficientes</h4>
                <p>Não existem valores válidos para esse indicador no filtro selecionado. Nenhuma variação foi calculada.</p>
              </div>
            )}
          </section>

          <div className="servicos-card-grafico">
            <h3>Evolução mensal — {nomeIndicador}</h3>
            <p>O filtro de ano atua neste gráfico e na tabela.</p>
            {dadosValidos.length ? (
              <div className="servicos-grafico" role="img" aria-label={`Gráfico de evolução mensal — ${nomeIndicador}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosFiltrados} margin={{ top: 8, right: 24, left: 0, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mesLabel" minTickGap={22} tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatarIndice} width={58} tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                    <Tooltip labelFormatter={(_rotulo, itens) => itens?.[0]?.payload?.periodoLabel ?? _rotulo} formatter={(valor) => [formatarIndice(valor), nomeIndicador]} />
                    <Line type="linear" dataKey="valor" stroke="#2563eb" strokeWidth={2.5} dot={dadosFiltrados.length <= 24} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="servicos-mensagem">Não há valores disponíveis para este indicador no ano selecionado.</p>}
          </div>

          <div className="servicos-card-grafico">
            <h3>Comparação mensal entre anos — {nomeIndicador}</h3>
            <p>O mesmo indicador, comparado mês a mês entre todos os anos disponíveis.</p>
            {existeAlgumValor ? (
              <div className="servicos-grafico" role="img" aria-label={`Gráfico de comparação entre anos — ${nomeIndicador}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosComparacao} margin={{ top: 8, right: 24, left: 0, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatarIndice} width={58} tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                    <Tooltip formatter={(valor, ano) => [formatarIndice(valor), `Ano ${ano}`]} />
                    <Legend verticalAlign="bottom" height={28} />
                    {anosDisponiveis.map((ano, indice) => (
                      <Line
                        key={ano}
                        name={String(ano)}
                        type="linear"
                        dataKey={String(ano)}
                        stroke={CORES[indice % CORES.length]}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 5 }}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="servicos-mensagem">Este indicador ainda não possui valores disponíveis.</p>}
            {anosIncompletos.length > 0 && (
              <p className="servicos-observacao">Anos com meses sem registro: {anosIncompletos.join(', ')}. Meses ausentes não são tratados como zero.</p>
            )}
          </div>

          <div className="servicos-card-tabela">
            <h3>Valores por mês — {nomeIndicador}</h3>
            <div className="servicos-tabela-scroll">
              <table>
                <thead><tr><th>Período</th><th>Valor do índice</th></tr></thead>
                <tbody>
                  {dadosFiltrados.map((linha) => (
                    <tr key={linha.periodo}>
                      <td>{linha.periodoLabel}</td>
                      <td>{formatarIndice(linha.valor)}</td>
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
