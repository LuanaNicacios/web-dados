import { fetchApiProtegida } from '../../../../services/apiProtegida'
import React, { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import {
  CORES_ANOS, MESES, formatarValor,
  selecionarNumero, tooltipNumerico, validarResposta
} from './DashboardNovosUtils'
import './DashboardNovosIndicadores.css'
import DestaquesIpca from './DestaquesIpca'
import { analisarIpca } from './analisesIpca.mjs'

const API_URL = 'http://127.0.0.1:3001/api/ipca'

export default function DashboardIpca() {
  const [dados, setDados] = useState([])
  const [indicadores, setIndicadores] = useState([])
  const [indicador, setIndicador] = useState('indice_geral')
  const [ano, setAno] = useState('todos')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()
    async function carregar() {
      setCarregando(true)
      setErro('')
      if (!import.meta.env.DEV) {
        setErro('Dados internos disponíveis somente no ambiente local de desenvolvimento.')
        setCarregando(false)
        return
      }
      try {
        const resposta = await fetchApiProtegida(API_URL, { signal: controlador.signal, cache: 'no-store' })
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        const json = await resposta.json()
        const validado = validarResposta(json, 'mensal', ['valores'])
        if (!controlador.signal.aborted) {
          setDados(validado.dados)
          setIndicadores(validado.indicadores)
          setIndicador((atual) => validado.indicadores.some((x) => x.campo === atual)
            ? atual : (validado.indicadores[0]?.campo || 'indice_geral'))
        }
      } catch (falha) {
        if (controlador.signal.aborted) return
        console.error('Erro ao carregar IPCA:', falha.message)
        setErro('Não foi possível consultar o IPCA. Confira VPN, backend e /api/ipca.')
      } finally {
        if (!controlador.signal.aborted) setCarregando(false)
      }
    }
    carregar()
    return () => controlador.abort()
  }, [versao])

  const anos = useMemo(() => [...new Set(dados.map((d) => d.ano))].sort((a, b) => a - b), [dados])
  const nomeIndicador = indicadores.find((x) => x.campo === indicador)?.nome || indicador
  const filtrados = useMemo(() => dados.filter((d) => ano === 'todos' || d.ano === Number(ano)), [dados, ano])
  const serie = useMemo(() => filtrados.map((d) => ({
    ...d, valor: selecionarNumero(d.valores, indicador)
  })), [filtrados, indicador])
  const analise = useMemo(() => analisarIpca(dados, indicador, ano), [dados, indicador, ano])
  const { ultimo, maior, menor, mensal } = analise
  const deltaMensal = mensal
    ? `${mensal.diferenca > 0 ? '+' : ''}${formatarValor(mensal.diferenca)}`
    : 'Sem comparação disponível'

  const comparativoAnos = useMemo(() => {
    if (ano === 'todos') return anos
    return [Number(ano) - 1, Number(ano)].filter((a) => anos.includes(a))
  }, [ano, anos])
  const comparativo = useMemo(() => MESES.map((mes, indice) => {
    const linha = { mes }
    comparativoAnos.forEach((a) => {
      const entrada = dados.find((d) => d.ano === a && d.parte === indice + 1)
      linha[`ano_${a}`] = selecionarNumero(entrada?.valores, indicador)
    })
    return linha
  }), [dados, comparativoAnos, indicador])

  return (
    <section className="novos-dashboard" aria-label="Análise de indicadores do IPCA">
      <header className="novos-topo">
        <div>
          <span className="novos-etiqueta">Demonstração local — PostgreSQL</span>
          <h2>Inflação e preços — IPCA</h2>
          <p>Evolução mensal dos indicadores disponíveis na tabela <strong>pib.ipca</strong>.</p>
        </div>
        <button type="button" className="novos-atualizar" disabled={carregando} onClick={() => setVersao((v) => v + 1)}>
          Atualizar dados
        </button>
      </header>
      <p className="novos-aviso">Fonte: PostgreSQL — <strong>pib.ipca</strong>. A unidade e a metodologia dos valores ainda precisam de validação. Valores negativos são preservados. Não interpretar diferenças como variações percentuais sem essa confirmação.</p>
      {erro && <p className="novos-erro" role="alert">{erro}</p>}
      {carregando ? <p className="novos-estado" role="status">Carregando indicadores do IPCA...</p> : !erro && <>
        <div className="novos-filtros">
          <label>Indicador
            <select value={indicador} onChange={(e) => setIndicador(e.target.value)}>
              {indicadores.map((x) => <option value={x.campo} key={x.campo}>{x.nome}</option>)}
            </select>
          </label>
          <label>Ano
            <select value={ano} onChange={(e) => setAno(e.target.value)}>
              <option value="todos">Todos os anos</option>
              {anos.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
        </div>
        <div className="novos-cards">
          <div className="novos-card"><span>Último registro</span><strong>{formatarValor(ultimo?.valor)}</strong><small>{ultimo?.extenso || 'Sem informação'}</small></div>
          <div className="novos-card"><span>Diferença vs mês anterior</span><strong>{deltaMensal}</strong><small>{mensal ? `Referência: ${mensal.rotuloAnterior}` : 'Mês imediatamente anterior indisponível'}</small></div>
          <div className="novos-card"><span>Maior valor no filtro</span><strong>{formatarValor(maior?.valor)}</strong><small>{maior?.extenso || 'Sem informação'}</small></div>
          <div className="novos-card"><span>Menor valor no filtro</span><strong>{formatarValor(menor?.valor)}</strong><small>{menor?.extenso || 'Sem informação'}</small></div>
        </div>
        <DestaquesIpca analise={analise} nomeIndicador={nomeIndicador} indicadores={indicadores} />
        <article className="novos-card-grafico">
          <h3>Evolução mensal — {nomeIndicador}</h3>
          <p>Valores na escala informada pela base, sem unidade confirmada.</p>
          {serie.length === 0 ? <p className="novos-estado">Não há registros para o filtro selecionado.</p> : (
            <div className="novos-grafico">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid stroke="#e1eaf5" strokeDasharray="3 3" />
                  <XAxis dataKey="rotulo" minTickGap={22} tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis width={54} tick={{ fill: '#475569', fontSize: 11 }} tickFormatter={formatarValor} />
                  <Tooltip formatter={(valor) => [tooltipNumerico(valor), nomeIndicador]} labelFormatter={(_, itens) => itens?.[0]?.payload?.extenso || ''} />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="valor" name={nomeIndicador} stroke="#2563eb" strokeWidth={2.5} dot={{ r: 2.5 }} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
        <article className="novos-card-grafico">
          <h3>Comparação entre anos</h3>
          <p>{ano === 'todos' ? 'Linhas referentes aos anos disponíveis.' : 'Ano escolhido comparado ao anterior, quando disponível.'} Meses sem informação permanecem vazios.</p>
          <div className="novos-grafico">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparativo} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#e1eaf5" strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis width={54} tick={{ fill: '#475569', fontSize: 11 }} tickFormatter={formatarValor} />
                <Tooltip formatter={tooltipNumerico} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" />
                {comparativoAnos.map((a, i) => <Line key={a} dataKey={`ano_${a}`} name={String(a)} stroke={CORES_ANOS[i % CORES_ANOS.length]} strokeWidth={2} dot={{ r: 2.5 }} connectNulls={false} isAnimationActive={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="novos-card-grafico">
          <h3>Valores mensais</h3>
          <div className="novos-tabela-scroll">
            <table><thead><tr><th>Período</th><th>{nomeIndicador}</th></tr></thead><tbody>
              {[...serie].reverse().map((d) => <tr key={d.periodo}><td>{d.extenso}</td><td>{formatarValor(d.valor)}</td></tr>)}
            </tbody></table>
          </div>
        </article>
      </>}
    </section>
  )
}
