import { fetchApiProtegida } from '../../../../services/apiProtegida'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import './DashboardLavouras.css'
import DestaquesLavouras from './DestaquesLavouras'

// Somente para desenvolvimento local. Não publicar esta API sem revisão de segurança.
const API_URL = 'http://127.0.0.1:3001/api/lavouras'
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const CORES_ANOS = ['#2563eb', '#059669', '#d97706', '#9333ea', '#db2777', '#0891b2']

const formatarNumero = (valor) =>
  valor === null || valor === undefined
    ? 'Sem informação'
    : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(valor)

const interpretarPeriodo = (entrada) => {
  const periodo = String(entrada ?? '').trim()
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

// O driver PostgreSQL pode retornar BIGINT como string.
const interpretarValor = (entrada) => {
  if (entrada === null || entrada === undefined || String(entrada).trim() === '') return null

  const texto = String(entrada).trim()
  if (!/^-?\d+(?:\.\d+)?$/.test(texto)) return null

  const valor = Number(texto)
  if (!Number.isFinite(valor)) return null
  if (!texto.includes('.') && !Number.isSafeInteger(valor)) return null
  return valor
}

function DashboardLavouras() {
  const [registros, setRegistros] = useState([])
  const [indicadores, setIndicadores] = useState([])
  const [indicadorSelecionado, setIndicadorSelecionado] = useState('')
  const [anoSelecionado, setAnoSelecionado] = useState('todos')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [recarregar, setRecarregar] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function buscarDados() {
      setCarregando(true)
      setErro('')

      if (!import.meta.env.DEV) {
        setErro('Este dashboard com dados internos está disponível somente no ambiente de desenvolvimento local.')
        setCarregando(false)
        return
      }

      try {
        const resposta = await fetchApiProtegida(API_URL, {
          signal: controller.signal,
          cache: 'no-store'
        })
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)

        const resultado = await resposta.json()
        if (
          resultado.status !== 'sucesso' ||
          !Array.isArray(resultado.dados) ||
          !Array.isArray(resultado.indicadores)
        ) {
          throw new Error('Resposta da API em formato inesperado')
        }

        const disponiveis = resultado.indicadores.filter(
          (item) => typeof item.campo === 'string' && typeof item.nome === 'string'
        )

        const vistos = new Set()
        const dados = []
        let invalidos = 0

        for (const linha of resultado.dados) {
          const periodo = interpretarPeriodo(linha.periodo)
          if (!periodo || vistos.has(periodo.periodo)) {
            invalidos += 1
            continue
          }

          vistos.add(periodo.periodo)
          const valores = Object.fromEntries(
            disponiveis.map(({ campo }) => [campo, interpretarValor(linha.valores?.[campo])])
          )
          dados.push({ ...periodo, valores })
        }

        if (invalidos) throw new Error(`${invalidos} período(s) inválido(s) ou repetido(s)`)
        if (!dados.length || !disponiveis.length) throw new Error('Nenhum indicador válido encontrado')

        dados.sort((a, b) => a.periodo.localeCompare(b.periodo))

        if (!controller.signal.aborted) {
          setRegistros(dados)
          setIndicadores(disponiveis)
          setIndicadorSelecionado((anterior) =>
            disponiveis.some((item) => item.campo === anterior)
              ? anterior
              : (disponiveis.find((item) => item.nome.toLowerCase() === 'arroz')?.campo ?? disponiveis[0].campo)
          )
        }
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('Falha ao carregar indicadores:', error.message)
        setErro('Não foi possível carregar os indicadores. Verifique a VPN, o servidor Node.js e a rota /api/lavouras.')
      } finally {
        if (!controller.signal.aborted) setCarregando(false)
      }
    }

    buscarDados()
    return () => controller.abort()
  }, [recarregar])

  const anosDisponiveis = useMemo(
    () => [...new Set(registros.map((item) => item.ano))].sort((a, b) => a - b),
    [registros]
  )

  const indicadorAtual = indicadores.find((item) => item.campo === indicadorSelecionado)
  const nomeIndicador = indicadorAtual?.nome ?? 'Indicador'

  const dadosFiltrados = useMemo(
    () => registros
      .filter((item) => anoSelecionado === 'todos' || item.ano === Number(anoSelecionado))
      .map((item) => ({
        ...item,
        valor: item.valores[indicadorSelecionado] ?? null
      })),
    [registros, anoSelecionado, indicadorSelecionado]
  )

  const valoresValidos = dadosFiltrados.filter((item) => item.valor !== null)
  const ultimoRegistro = valoresValidos.at(-1) ?? null
  const menor = valoresValidos.length ? Math.min(...valoresValidos.map((item) => item.valor)) : null
  const maior = valoresValidos.length ? Math.max(...valoresValidos.map((item) => item.valor)) : null

  // A comparação usa todos os anos, independentemente do filtro do primeiro gráfico.
  // Inclui somente anos que tenham ao menos um valor válido para o indicador escolhido.
  const anosComparaveis = useMemo(
    () => anosDisponiveis.filter((ano) => registros.some(
      (linha) => linha.ano === ano && linha.valores[indicadorSelecionado] !== null &&
        linha.valores[indicadorSelecionado] !== undefined
    )),
    [anosDisponiveis, registros, indicadorSelecionado]
  )

  const dadosComparacao = useMemo(() => {
    const mapa = new Map(registros.map((linha) => [`${linha.ano}-${linha.mes}`, linha]))

    return MESES.map((mes, indice) => {
      const numeroMes = indice + 1
      const valoresPorAno = Object.fromEntries(
        anosComparaveis.map((ano) => {
          const linha = mapa.get(`${ano}-${numeroMes}`)
          return [String(ano), linha?.valores[indicadorSelecionado] ?? null]
        })
      )
      return { mes, ...valoresPorAno }
    })
  }, [registros, indicadorSelecionado, anosComparaveis])

  const tentarNovamente = useCallback(() => setRecarregar((atual) => atual + 1), [])

  return (
    <section className="lavouras-dashboard" aria-labelledby="lavouras-titulo">
      <div className="lavouras-topo">
        <div>
          <span className="lavouras-etiqueta">Demonstração local — PostgreSQL</span>
          <h2 id="lavouras-titulo">Indicadores da Agropecuária</h2>
          <p>Visualização mensal dos dados consultados pela API local de desenvolvimento.</p>
        </div>
      </div>

      <div className="lavouras-aviso">
        Os valores são exibidos como registrados na base. A unidade de medida e algumas variações
        ainda precisam ser confirmadas com a equipe de dados.
      </div>

      <div className="lavouras-importacao">
        <div>
          <strong>Fonte: PostgreSQL — pib.lavouras</strong>
          <p>Selecione um indicador agrícola para acompanhar sua evolução e comparar os anos.</p>
          <small>É necessário manter a VPN e o servidor Node.js em execução.</small>
        </div>
        <div className="lavouras-acoes">
          <button
            type="button"
            className="lavouras-botao-secundario"
            onClick={tentarNovamente}
            disabled={carregando}
          >
            {carregando ? 'Carregando...' : 'Atualizar dados'}
          </button>
        </div>
      </div>

      {erro && <p className="lavouras-erro" role="alert">{erro}</p>}
      {carregando && <p className="lavouras-vazio">Consultando os indicadores...</p>}

      {!carregando && !erro && registros.length > 0 && (
        <>
          <div className="lavouras-filtros">
            <label>
              Indicador
              <select
                value={indicadorSelecionado}
                onChange={(evento) => setIndicadorSelecionado(evento.target.value)}
              >
                {indicadores.map(({ campo, nome }) => (
                  <option key={campo} value={campo}>{nome}</option>
                ))}
              </select>
            </label>
            <label>
              Ano (evolução mensal)
              <select
                value={anoSelecionado}
                onChange={(evento) => setAnoSelecionado(evento.target.value)}
              >
                <option value="todos">Todos os anos</option>
                {anosDisponiveis.map((ano) => (
                  <option value={String(ano)} key={ano}>{ano}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="lavouras-indicadores">
            <div><span>Meses com registros</span><strong>{dadosFiltrados.length}</strong></div>
            <div>
              <span>Último valor disponível</span>
              <strong>{formatarNumero(ultimoRegistro?.valor)}</strong>
              <small>{ultimoRegistro?.periodoLabel ?? '—'}</small>
            </div>
            <div><span>Menor valor</span><strong>{formatarNumero(menor)}</strong></div>
            <div><span>Maior valor</span><strong>{formatarNumero(maior)}</strong></div>
          </div>

            <DestaquesLavouras
              registros={registros}
              dadosFiltrados={dadosFiltrados}
              campo={indicadorSelecionado}
              nomeIndicador={nomeIndicador}
              anoSelecionado={anoSelecionado}
            />

            {valoresValidos.length === 0 ? (
            <p className="lavouras-vazio" role="status">
              Não há dados disponíveis para {nomeIndicador} no período selecionado.
            </p>
          ) : (
            <div className="lavouras-grafico-card">
              <h3>Evolução mensal — {nomeIndicador}</h3>
              <p>Valor registrado (unidade a confirmar). O filtro de ano atua neste gráfico e na tabela.</p>
              <div
                className="lavouras-grafico"
                role="img"
                aria-label={`Gráfico de evolução mensal do indicador ${nomeIndicador}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosFiltrados} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mesLabel" minTickGap={20} tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatarNumero} width={70} tick={{ fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(rotulo, itens) => itens?.[0]?.payload?.periodoLabel ?? rotulo}
                      formatter={(valor) => [formatarNumero(valor), nomeIndicador]}
                    />
                    <Line
                      type="linear"
                      dataKey="valor"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={dadosFiltrados.length <= 24}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {anosComparaveis.length > 0 && (
            <div className="lavouras-grafico-card">
              <h3>Comparação mensal entre anos — {nomeIndicador}</h3>
              <p>
                As linhas mostram os valores de cada ano no mesmo mês. O gráfico inclui todos os anos
                com dados disponíveis, mesmo quando um ano específico está selecionado acima.
                Meses sem informação permanecem sem pontos.
              </p>
              <div
                className="lavouras-grafico"
                role="img"
                aria-label={`Comparação mensal entre anos para ${nomeIndicador}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosComparacao} margin={{ top: 10, right: 20, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatarNumero} width={70} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(valor, ano) => [formatarNumero(valor), ano]} />
                    <Legend />
                    {anosComparaveis.map((ano, indice) => (
                      <Line
                        key={ano}
                        name={String(ano)}
                        type="linear"
                        dataKey={String(ano)}
                        stroke={CORES_ANOS[indice % CORES_ANOS.length]}
                        strokeWidth={2.5}
                        dot={{ r: 2 }}
                        activeDot={{ r: 5 }}
                        connectNulls={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="lavouras-tabela-card">
            <h3>Valores por mês — {nomeIndicador}</h3>
            <div className="lavouras-tabela-rolagem">
              <table>
                <thead>
                  <tr><th>Período</th><th>Valor</th></tr>
                </thead>
                <tbody>
                  {dadosFiltrados.map((item) => (
                    <tr key={item.periodo}>
                      <td>{item.periodoLabel}</td>
                      <td>{formatarNumero(item.valor)}</td>
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

export default DashboardLavouras
