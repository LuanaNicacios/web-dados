import { fetchApiProtegida } from '../../../../services/apiProtegida'
import React, { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts'
import {
  GRUPOS_PECUARIA, ROTULOS_PECUARIA, MESES_PECUARIA,
  analisarIndicador, anosDoIndicador, comparacaoAnualPecuaria,
  formatarDiferencaPecuaria, formatarPecuaria, obterSerieIndicador,
  prepararPecuaria
} from './analisesPecuaria.mjs'
import './DashboardPecuaria.css'

const API_URL = 'http://127.0.0.1:3001/api/pecuaria'
const CORES_ANOS = ['#1d63d5', '#0e8571', '#ad6b11', '#7c3aed', '#c24171', '#087e9a']

function nomePeriodo(periodo) {
  if (!periodo) return 'Sem informação'
  const ano = Number(periodo.slice(0, 4))
  const mes = Number(periodo.slice(4, 6))
  return `${MESES_PECUARIA[mes - 1]}/${ano}`
}

function cartao(nome, valor, detalhe, cor = '') {
  return <div className={`pec-card-metrica ${cor}`} key={nome}>
    <span>{nome}</span>
    <strong>{valor}</strong>
    <small>{detalhe}</small>
  </div>
}

function graficoSemDados(serie) {
  return !serie.some((d) => d.valor !== null)
}

export default function DashboardPecuaria({ grupo = 'animais' }) {
  const configuracao = GRUPOS_PECUARIA[grupo] ?? GRUPOS_PECUARIA.animais
  const [estado, setEstado] = useState({ dados: [], cobertura: {} })
  const [indicador, setIndicador] = useState(configuracao.campos[0])
  const [ano, setAno] = useState('todos')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()
    async function consultar() {
      setCarregando(true)
      setErro('')
      if (!import.meta.env.DEV) {
        setErro('Este painel com dados internos está disponível somente em desenvolvimento local.')
        setCarregando(false)
        return
      }
      try {
        const resposta = await fetchApiProtegida(API_URL, { cache: 'no-store', signal: controlador.signal })
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        const json = await resposta.json()
        const preparado = prepararPecuaria(json)
        if (!controlador.signal.aborted) setEstado(preparado)
      } catch (falha) {
        if (controlador.signal.aborted) return
        console.error('Erro ao consultar pecuária:', falha.message)
        setErro('Não foi possível carregar os indicadores. Verifique a VPN, o servidor Node.js e /api/pecuaria.')
      } finally {
        if (!controlador.signal.aborted) setCarregando(false)
      }
    }
    consultar()
    return () => controlador.abort()
  }, [versao])

  const { dados, cobertura } = estado
  const anos = useMemo(() => anosDoIndicador(dados, cobertura, indicador), [dados, cobertura, indicador])
  const resumo = useMemo(() => analisarIndicador(dados, cobertura, indicador, ano), [dados, cobertura, indicador, ano])
  const comparacao = useMemo(() => comparacaoAnualPecuaria(dados, cobertura, indicador, ano), [dados, cobertura, indicador, ano])
  const { serie, validos, ultimo, maior, menor } = resumo
  const nome = ROTULOS_PECUARIA[indicador]
  const abrangencia = cobertura[indicador]
  const semDados = graficoSemDados(serie)

  const visaoGeral = configuracao.campos.map((campo) => {
    const total = obterSerieIndicador(dados, cobertura, campo)
    const ultimoDisponivel = total.filter((d) => d.valor !== null).at(-1)
    return { campo, ultimo: ultimoDisponivel }
  })

  function selecionarIndicador(campo) {
    setIndicador(campo)
    setAno('todos')
  }

  return (
    <section className="pec-dashboard" aria-label={`Indicadores de ${configuracao.titulo}`}>
      <header className="pec-cabecalho">
        <div>
          <span className="pec-etiqueta">Dados do PostgreSQL — ambiente local</span>
          <h2>{configuracao.titulo}</h2>
          <p>{configuracao.descricao}</p>
        </div>
        <button className="pec-atualizar" type="button" disabled={carregando} onClick={() => setVersao((v) => v + 1)}>
          {carregando ? 'Consultando...' : 'Atualizar dados'}
        </button>
      </header>

      <p className="pec-aviso">
        <strong>Fonte:</strong> PostgreSQL, tabelas do schema <code>pib</code>. Os nomes das medidas não esclarecem
        se representam efetivos, abates ou produção. Conceito, unidade e periodicidade ainda serão validados.
        A ausência de um registro não representa zero.
      </p>

      {erro && <p className="pec-erro" role="alert">{erro}</p>}
      {carregando && <p className="pec-estado" role="status">Consultando dados de pecuária...</p>}
      {!carregando && !erro && <>
        <div className="pec-panorama">
          {visaoGeral.map(({ campo, ultimo: atual }) => (
            <button
              type="button"
              key={campo}
              className={`pec-panorama-item ${indicador === campo ? 'pec-panorama-ativo' : ''}`}
              aria-pressed={indicador === campo}
              onClick={() => selecionarIndicador(campo)}
            >
              <span>{ROTULOS_PECUARIA[campo]}</span>
              <strong>{formatarPecuaria(atual?.valor)}</strong>
              <small>Último registro: {atual?.extenso ?? 'Indisponível'}</small>
            </button>
          ))}
        </div>

        <div className="pec-filtros">
          <label>Indicador
            <select value={indicador} onChange={(e) => selecionarIndicador(e.target.value)}>
              {configuracao.campos.map((campo) => <option key={campo} value={campo}>{ROTULOS_PECUARIA[campo]}</option>)}
            </select>
          </label>
          <label>Ano
            <select value={ano} onChange={(e) => setAno(e.target.value)}>
              <option value="todos">Todos os anos disponíveis</option>
              {anos.map((a) => <option key={a} value={String(a)}>{a}</option>)}
            </select>
          </label>
        </div>

        <div className="pec-metricas">
          {cartao('Último valor disponível', formatarPecuaria(ultimo?.valor), ultimo?.extenso ?? 'Sem informação', 'pec-metrica-azul')}
          {cartao('Maior valor', formatarPecuaria(maior?.valor), maior?.extenso ?? 'Sem informação')}
          {cartao('Menor valor', formatarPecuaria(menor?.valor), menor?.extenso ?? 'Sem informação')}
          {cartao('Meses com valor', String(validos.length), `${resumo.ausentes} período(s) sem valor`)}
        </div>

        <article className="pec-grafico-card">
          <h3>Evolução dos registros — {nome}</h3>
          <p>A linha representa somente o indicador selecionado, na escala original informada pela base.</p>
          {semDados ? <p className="pec-estado">Não há valores disponíveis para este indicador no filtro selecionado.</p> :
            <div className="pec-grafico">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie} margin={{ top: 12, right: 20, bottom: 8, left: 4 }}>
                  <CartesianGrid stroke="#dce6f3" strokeDasharray="3 3" />
                  <XAxis dataKey="rotulo" minTickGap={25} tick={{ fill: '#415775', fontSize: 12 }} />
                  <YAxis width={76} tickFormatter={formatarPecuaria} tick={{ fill: '#415775', fontSize: 12 }} domain={['auto', 'auto']} />
                  <Tooltip labelFormatter={(_, itens) => itens?.[0]?.payload?.extenso ?? ''} formatter={(valor) => [formatarPecuaria(valor), nome]} />
                  <Line dataKey="valor" type="linear" name={nome} stroke="#205ed3" strokeWidth={2.7}
                    dot={serie.length <= 18 ? { r: 3 } : false} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>}
        </article>

        <article className="pec-grafico-card">
          <h3>Comparação mensal entre anos — {nome}</h3>
          <p>{ano === 'todos' ? 'Todos os anos com valores para este indicador.' : 'Ano escolhido e ano anterior, quando disponíveis.'} Meses sem registro ficam sem pontos.</p>
          {comparacao.anos.length === 0 ? <p className="pec-estado">Sem anos disponíveis para comparação.</p> :
            <div className="pec-grafico">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparacao.linhas} margin={{ top: 12, right: 20, bottom: 8, left: 4 }}>
                  <CartesianGrid stroke="#dce6f3" strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fill: '#415775', fontSize: 12 }} />
                  <YAxis width={76} tickFormatter={formatarPecuaria} tick={{ fill: '#415775', fontSize: 12 }} domain={['auto', 'auto']} />
                  <Tooltip formatter={(valor, linha) => [formatarPecuaria(valor), `Ano ${linha}`]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {comparacao.anos.map((a, indice) => <Line key={a} type="linear" name={String(a)} dataKey={`ano_${a}`}
                    stroke={CORES_ANOS[indice % CORES_ANOS.length]} strokeWidth={2.2} dot={{ r: 2 }} activeDot={{ r: 5 }}
                    connectNulls={false} isAnimationActive={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>}
        </article>

        <article className="pec-destaques">
          <h3>Destaques e pontos de atenção</h3>
          {ultimo ? <>
            <div className="pec-destaques-grade">
              <div className="pec-destaque-item">
                <span>Diferença vs. mês anterior</span>
                <strong>{formatarDiferencaPecuaria(resumo.diferencaMensal)}</strong>
                <small>{resumo.referenciaMensal ? `Referência: ${resumo.referenciaMensal.extenso}` : 'Sem mês imediatamente anterior disponível'}</small>
              </div>
              <div className="pec-destaque-item">
                <span>Diferença vs. mesmo mês do ano anterior</span>
                <strong>{formatarDiferencaPecuaria(resumo.diferencaAnual)}</strong>
                <small>{resumo.referenciaAnual ? `Referência: ${resumo.referenciaAnual.extenso}` : 'Comparação interanual indisponível'}</small>
              </div>
            </div>
            <p><strong>Extremos:</strong> maior valor em {maior?.extenso} e menor em {menor?.extenso}, dentro do filtro escolhido.</p>
            <p><strong>Movimento dos registros:</strong> {resumo.altas} alta(s), {resumo.quedas} queda(s), {resumo.estaveis} período(s) estável(is), em {resumo.pares} comparação(ões) de meses consecutivos.</p>
          </> : <p>O período selecionado não contém valores válidos para o indicador.</p>}
          <p><strong>Cobertura da tabela:</strong> {abrangencia?.primeiro ? nomePeriodo(abrangencia.primeiro) : '—'} a {abrangencia?.ultimo ? nomePeriodo(abrangencia.ultimo) : '—'}.</p>
          {indicador === 'ovos' && <p className="pec-atencao"><strong>Atenção:</strong> a série de Ovos termina em mar/2024 nesta base; os demais indicadores chegam até set/2025. Isso não deve ser interpretado como produção igual a zero nos meses posteriores.</p>}
          <p className="pec-nota">As diferenças são aritméticas entre valores da mesma série, não representam percentuais, estoques ou crescimento causal. Unidades e conceitos pendentes de validação.</p>
        </article>

        <article className="pec-grafico-card">
          <h3>Tabela de registros — {nome}</h3>
          <div className="pec-tabela-scroll">
            <table>
              <thead><tr><th>Período</th><th>Valor informado</th></tr></thead>
              <tbody>
                {[...serie].reverse().map((linha) => <tr key={linha.periodo}>
                  <td>{linha.extenso}</td>
                  <td>{formatarPecuaria(linha.valor)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </article>
      </>}
    </section>
  )
}
