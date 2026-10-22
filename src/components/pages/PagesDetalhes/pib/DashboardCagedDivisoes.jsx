import { fetchApiProtegida } from '../../../../services/apiProtegida'
import React, { useEffect, useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import './DashboardCagedDivisoes.css'

// API exclusivamente local, até aprovação da implantação institucional.
const API_URL = 'http://127.0.0.1:3001/api/mercado-trabalho-divisoes'
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const numeroBR = (valor) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(valor)
const saldoBR = (valor) => `${valor > 0 ? '+' : ''}${numeroBR(valor)}`

function validarDados(resposta) {
  if (resposta?.status !== 'sucesso' || resposta?.secao !== 'I' || !Array.isArray(resposta.dados)) {
    throw new Error('Formato inesperado da API de divisões')
  }
  const vistos = new Set()
  const linhas = resposta.dados.map((linha) => {
    const mes = String(linha.mes ?? '')
    const divisao = String(linha.divisao ?? '')
    const nome = String(linha.nome ?? '')
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes) || !['55', '56'].includes(divisao) || !nome) {
      throw new Error('Período ou divisão CNAE inesperado')
    }
    const chave = `${mes}|${divisao}`
    if (vistos.has(chave)) throw new Error('Mês/divisão repetido na API')
    vistos.add(chave)
    const admitidos = Number(linha.admitidos)
    const desligados = Number(linha.desligados)
    if (![admitidos, desligados].every((x) => Number.isSafeInteger(x) && x >= 0)) {
      throw new Error('Valor inválido de admissões ou desligamentos')
    }
    const ano = Number(mes.slice(0, 4))
    const numeroMes = Number(mes.slice(5, 7))
    return {
      mes,
      ano,
      numeroMes,
      rotulo: `${MESES[numeroMes - 1]}/${String(ano).slice(-2)}`,
      divisao,
      nome,
      admitidos,
      desligados,
      saldo: admitidos - desligados
    }
  })
  return linhas.sort((a, b) => a.mes.localeCompare(b.mes) || a.divisao.localeCompare(b.divisao))
}

export default function DashboardCagedDivisoes() {
  const [dados, setDados] = useState([])
  const [ano, setAno] = useState('todos')
  const [mes, setMes] = useState('todos')
  const [divisao, setDivisao] = useState('todas')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [atualizacao, setAtualizacao] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function buscar() {
      setCarregando(true)
      setErro('')
      if (!import.meta.env.DEV) {
        setErro('Dados internos disponíveis somente no desenvolvimento local.')
        setCarregando(false)
        return
      }
      try {
        const resposta = await fetchApiProtegida(API_URL, { cache: 'no-store', signal: controller.signal })
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        const json = await resposta.json()
        const linhas = validarDados(json)
        if (!controller.signal.aborted) setDados(linhas)
      } catch (falha) {
        if (controller.signal.aborted) return
        console.error('Falha ao carregar divisões CNAE:', falha.message)
        setErro('Não foi possível carregar Alojamento e Alimentação. Verifique VPN, servidor e rota /api/mercado-trabalho-divisoes.')
      } finally {
        if (!controller.signal.aborted) setCarregando(false)
      }
    }
    buscar()
    return () => controller.abort()
  }, [atualizacao])

  const anos = useMemo(() => [...new Set(dados.map((d) => d.ano))].sort((a, b) => a - b), [dados])
  const filtrados = useMemo(() => dados.filter((d) =>
    (ano === 'todos' || d.ano === Number(ano)) &&
    (mes === 'todos' || d.numeroMes === Number(mes)) &&
    (divisao === 'todas' || d.divisao === divisao)
  ), [dados, ano, mes, divisao])

  const resumo = useMemo(() => filtrados.reduce((a, d) => ({
    admitidos: a.admitidos + d.admitidos,
    desligados: a.desligados + d.desligados
  }), { admitidos: 0, desligados: 0 }), [filtrados])
  const saldoTotal = resumo.admitidos - resumo.desligados

  const evolucao = useMemo(() => {
    const mapa = new Map()
    filtrados.forEach((d) => {
      const item = mapa.get(d.mes) || { mes: d.mes, rotulo: d.rotulo, admitidos: 0, desligados: 0 }
      item.admitidos += d.admitidos
      item.desligados += d.desligados
      mapa.set(d.mes, item)
    })
    return [...mapa.values()].sort((a, b) => a.mes.localeCompare(b.mes))
      .map((d) => ({ ...d, saldo: d.admitidos - d.desligados }))
  }, [filtrados])

  const porDivisao = useMemo(() => {
    const mapa = new Map()
    filtrados.forEach((d) => {
      const item = mapa.get(d.divisao) || { divisao: d.divisao, nome: d.nome, admitidos: 0, desligados: 0 }
      item.admitidos += d.admitidos
      item.desligados += d.desligados
      mapa.set(d.divisao, item)
    })
    return [...mapa.values()].map((d) => ({ ...d, saldo: d.admitidos - d.desligados }))
      .sort((a, b) => b.saldo - a.saldo)
  }, [filtrados])

  const maiorSaldo = porDivisao[0] || null
  const menorSaldo = porDivisao.at(-1) || null
  const maisAdmissoes = evolucao.reduce((a, d) => !a || d.admitidos > a.admitidos ? d : a, null)
  const mesesComDados = evolucao.length

  return (
    <section className="caged-div-dashboard" aria-label="CAGED por divisão CNAE da seção I">
      <header className="caged-div-topo">
        <div>
          <span className="caged-div-etiqueta">Demonstração local — PostgreSQL</span>
          <h2>Alojamento e Alimentação — CNAE I</h2>
          <p>Detalhamento das movimentações do CAGED nas divisões 55 e 56.</p>
        </div>
        <button type="button" className="caged-div-atualizar" disabled={carregando} onClick={() => setAtualizacao((x) => x + 1)}>
          {carregando ? 'Consultando...' : 'Atualizar dados'}
        </button>
      </header>

      <p className="caged-div-aviso">
        <strong>Abrangência:</strong> somente seção I (55 — Alojamento; 56 — Alimentação).
        Os saldos correspondem a admissões menos desligamentos, não ao estoque de empregos.
        A visão geral por seção utiliza os mesmos movimentos em outro nível de agregação; <strong>não some os dois dashboards</strong>.
      </p>

      {erro && <p className="caged-div-erro" role="alert">{erro}</p>}
      {carregando && <p className="caged-div-estado" role="status">Consultando registros do CAGED por divisão...</p>}
      {!carregando && !erro && <>
        <div className="caged-div-filtros">
          <label>Ano
            <select value={ano} onChange={(e) => setAno(e.target.value)}>
              <option value="todos">Todos os anos</option>
              {anos.map((a) => <option key={a} value={String(a)}>{a}</option>)}
            </select>
          </label>
          <label>Mês
            <select value={mes} onChange={(e) => setMes(e.target.value)}>
              <option value="todos">Todos os meses</option>
              {MESES.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
            </select>
          </label>
          <label>Divisão CNAE
            <select value={divisao} onChange={(e) => setDivisao(e.target.value)}>
              <option value="todas">55 e 56 — ambas</option>
              <option value="55">55 — Alojamento</option>
              <option value="56">56 — Alimentação</option>
            </select>
          </label>
        </div>

        {filtrados.length === 0 ? <p className="caged-div-estado">Não há registros para os filtros selecionados.</p> : <>
          <div className="caged-div-kpis">
            <div className="caged-div-kpi"><span>Admissões</span><strong>{numeroBR(resumo.admitidos)}</strong></div>
            <div className="caged-div-kpi"><span>Desligamentos</span><strong>{numeroBR(resumo.desligados)}</strong></div>
            <div className="caged-div-kpi"><span>Saldo</span><strong className={saldoTotal < 0 ? 'negativo' : 'positivo'}>{saldoBR(saldoTotal)}</strong></div>
            <div className="caged-div-kpi"><span>Meses com registros</span><strong>{mesesComDados}</strong></div>
          </div>

          <article className="caged-div-card">
            <h3>Evolução mensal — admissões, desligamentos e saldo</h3>
            <p>O saldo utiliza um eixo separado à direita por ter escala diferente das movimentações.</p>
            <div className="caged-div-grafico">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolucao} margin={{ top: 10, right: 18, bottom: 8, left: 4 }}>
                  <CartesianGrid stroke="#dce7f5" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="rotulo" tick={{ fill: '#334155', fontSize: 12 }} />
                  <YAxis yAxisId="fluxos" width={56} tick={{ fill: '#334155', fontSize: 11 }} tickFormatter={numeroBR} />
                  <YAxis yAxisId="saldo" orientation="right" width={58} tick={{ fill: '#0f766e', fontSize: 11 }} tickFormatter={numeroBR} />
                  <Tooltip formatter={(valor, nome) => [numeroBR(valor), nome]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine yAxisId="saldo" y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                  <Bar yAxisId="fluxos" dataKey="admitidos" name="Admissões" fill="#2563eb" maxBarSize={24} />
                  <Bar yAxisId="fluxos" dataKey="desligados" name="Desligamentos" fill="#8ba8d3" maxBarSize={24} />
                  <Line yAxisId="saldo" dataKey="saldo" name="Saldo" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 2 }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="caged-div-card">
            <h3>Saldo por divisão CNAE</h3>
            <p>Comparação restrita às divisões efetivamente disponíveis na tabela.</p>
            <div className="caged-div-grafico caged-div-grafico-curto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porDivisao} layout="vertical" margin={{ top: 6, right: 30, bottom: 6, left: 10 }}>
                  <CartesianGrid stroke="#dce7f5" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={numeroBR} tick={{ fill: '#334155', fontSize: 11 }} />
                  <YAxis dataKey="nome" type="category" width={96} tick={{ fill: '#334155', fontSize: 12 }} />
                  <Tooltip formatter={(valor) => [saldoBR(valor), 'Saldo']} />
                  <ReferenceLine x={0} stroke="#64748b" />
                  <Bar dataKey="saldo" fill="#2563eb" barSize={28} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="caged-div-destaques">
            <h3>Destaques do período selecionado</h3>
            <p><strong>Resultado das divisões selecionadas:</strong> {saldoTotal > 0 ? 'saldo positivo' : saldoTotal < 0 ? 'saldo negativo' : 'saldo nulo'} de {saldoBR(saldoTotal)}.</p>
            {maiorSaldo && <p><strong>Maior saldo entre as divisões exibidas:</strong> {maiorSaldo.divisao} — {maiorSaldo.nome}, {saldoBR(maiorSaldo.saldo)}.</p>}
            {menorSaldo && porDivisao.length > 1 && <p><strong>Menor saldo entre as divisões exibidas:</strong> {menorSaldo.divisao} — {menorSaldo.nome}, {saldoBR(menorSaldo.saldo)}.</p>}
            {maisAdmissoes && <p><strong>Mês com mais admissões:</strong> {maisAdmissoes.rotulo}, com {numeroBR(maisAdmissoes.admitidos)}.</p>}
            <p className="caged-div-nota">O destaque considera somente o filtro atual. São movimentos do emprego formal, não o estoque de trabalhadores ocupados.</p>
          </article>

          <article className="caged-div-card">
            <h3>Movimentações por mês e divisão</h3>
            <div className="caged-div-tabela-rolagem">
              <table>
                <thead><tr><th>Período</th><th>Divisão</th><th>Admissões</th><th>Desligamentos</th><th>Saldo</th></tr></thead>
                <tbody>{[...filtrados].reverse().map((d) => <tr key={`${d.mes}-${d.divisao}`}>
                  <td>{d.rotulo}</td><td>{d.divisao} — {d.nome}</td><td>{numeroBR(d.admitidos)}</td>
                  <td>{numeroBR(d.desligados)}</td><td className={d.saldo < 0 ? 'caged-div-negativo' : 'caged-div-positivo'}>{saldoBR(d.saldo)}</td>
                </tr>)}</tbody>
              </table>
            </div>
          </article>
        </>}
      </>}
    </section>
  )
}
