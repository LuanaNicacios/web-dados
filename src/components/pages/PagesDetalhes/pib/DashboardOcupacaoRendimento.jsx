import { fetchApiProtegida } from '../../../../services/apiProtegida'
import React, { useEffect, useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts'
import {
  formatarValor, selecionarNumero, tooltipNumerico,
  validarResposta
} from './DashboardNovosUtils'
import './DashboardNovosIndicadores.css'
import DestaquesOcupacaoRendimento from './DestaquesOcupacaoRendimento'
import { calcularAnaliseOcupacaoRendimento } from './analisesOcupacaoRendimento.mjs'

const API_URL = 'http://127.0.0.1:3001/api/ocupacao-rendimento'

function GraficoEvolucao({ titulo, descricao, dados, campo, cor }) {
  return <article className="novos-card-grafico">
    <h3>{titulo}</h3>
    <p>{descricao}</p>
    <div className="novos-grafico">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 14, right: 18, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#e1eaf5" strokeDasharray="3 3" />
          <XAxis dataKey="rotulo" minTickGap={26} tick={{ fill: '#475569', fontSize: 11 }} />
          <YAxis width={58} tick={{ fill: '#475569', fontSize: 11 }} tickFormatter={formatarValor} />
          <Tooltip formatter={(valor) => [tooltipNumerico(valor), titulo]} labelFormatter={(_, items) => items?.[0]?.payload?.extenso || ''} />
          <Line dataKey={campo} name={titulo} type="monotone" stroke={cor} strokeWidth={2.5} dot={{ r: 2.5 }} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </article>
}

export default function DashboardOcupacaoRendimento() {
  const [dados, setDados] = useState([])
  const [indicadores, setIndicadores] = useState([])
  const [setor, setSetor] = useState('total')
  const [ano, setAno] = useState('todos')
  const [trimestre, setTrimestre] = useState('todos')
  const [tipoRanking, setTipoRanking] = useState('ocupacao')
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
        const validado = validarResposta(json, 'trimestral', ['ocupacao', 'rendimento'])
        if (!validado.indicadores.some((x) => x.campo === 'total')) throw new Error('Indicador Total ausente')
        if (!controlador.signal.aborted) {
          setDados(validado.dados)
          setIndicadores(validado.indicadores)
          setSetor((atual) => validado.indicadores.some((x) => x.campo === atual) ? atual : 'total')
        }
      } catch (falha) {
        if (controlador.signal.aborted) return
        console.error('Erro ao carregar Ocupação e Rendimento:', falha.message)
        setErro('Não foi possível consultar Ocupação e Rendimento. Confira VPN, backend e /api/ocupacao-rendimento.')
      } finally {
        if (!controlador.signal.aborted) setCarregando(false)
      }
    }
    carregar()
    return () => controlador.abort()
  }, [versao])

  const anos = useMemo(() => [...new Set(dados.map((d) => d.ano))].sort((a, b) => a - b), [dados])
  const nomeSetor = indicadores.find((x) => x.campo === setor)?.nome || setor
  const filtrados = useMemo(() => dados.filter((d) =>
    (ano === 'todos' || d.ano === Number(ano)) &&
    (trimestre === 'todos' || d.parte === Number(trimestre))
  ), [dados, ano, trimestre])
  const serie = useMemo(() => filtrados.map((d) => ({
    ...d,
    ocupacaoValor: selecionarNumero(d.ocupacao, setor),
    rendimentoValor: selecionarNumero(d.rendimento, setor)
  })), [filtrados, setor])
  const ultimo = serie.at(-1) || null
  const ranking = useMemo(() => {
    if (!ultimo) return []
    const mapa = dados.find((d) => d.periodo === ultimo.periodo)?.[tipoRanking]
    return indicadores.filter((x) => x.campo !== 'total').map((item) => ({
      chave: item.campo,
      nome: item.nome,
      curto: item.nome.length > 27 ? `${item.nome.slice(0, 25)}…` : item.nome,
      valor: selecionarNumero(mapa, item.campo)
    })).filter((item) => item.valor !== null).sort((a, b) => b.valor - a.valor)
  }, [dados, indicadores, ultimo, tipoRanking])
  const analise = useMemo(
    () => calcularAnaliseOcupacaoRendimento(dados, serie, setor),
    [dados, serie, setor]
  )
  const diferencaExata = (comparacao) => comparacao
    ? `${comparacao.diferenca > 0 ? '+' : ''}${formatarValor(comparacao.diferenca)}`
    : 'Sem comparação'

  return (
    <section className="novos-dashboard" aria-label="Análise de ocupação e rendimento">
      <header className="novos-topo">
        <div>
          <span className="novos-etiqueta">Demonstração local — PostgreSQL</span>
          <h2>Ocupação e Rendimento</h2>
          <p>Indicadores trimestrais de <strong>pib.pessoas_ocupadas</strong> e <strong>pib.rendimento_efetivo</strong>.</p>
        </div>
        <button type="button" className="novos-atualizar" disabled={carregando} onClick={() => setVersao((v) => v + 1)}>
          Atualizar dados
        </button>
      </header>
      <p className="novos-aviso">As unidades de pessoas ocupadas e rendimento ainda dependem de validação. Os indicadores são exibidos em gráficos separados. Valores ausentes permanecem sem informação; atividades econômicas podem se sobrepor e não devem ser somadas.</p>
      {erro && <p className="novos-erro" role="alert">{erro}</p>}
      {carregando ? <p className="novos-estado" role="status">Carregando Ocupação e Rendimento...</p> : !erro && <>
        <div className="novos-filtros novos-filtros-triplos">
          <label>Atividade econômica
            <select value={setor} onChange={(e) => setSetor(e.target.value)}>
              {indicadores.map((x) => <option key={x.campo} value={x.campo}>{x.nome}</option>)}
            </select>
          </label>
          <label>Ano
            <select value={ano} onChange={(e) => setAno(e.target.value)}>
              <option value="todos">Todos os anos</option>
              {anos.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label>Trimestre
            <select value={trimestre} onChange={(e) => setTrimestre(e.target.value)}>
              <option value="todos">Todos os trimestres</option>
              {[1, 2, 3, 4].map((t) => <option key={t} value={t}>{t}º trimestre</option>)}
            </select>
          </label>
        </div>
        <div className="novos-cards">
          <div className="novos-card"><span>Ocupação — último registro</span><strong>{formatarValor(ultimo?.ocupacaoValor)}</strong><small>{ultimo?.extenso || 'Sem informação'}</small></div>
          <div className="novos-card"><span>Rendimento — último registro</span><strong>{formatarValor(ultimo?.rendimentoValor)}</strong><small>{ultimo?.extenso || 'Sem informação'}</small></div>
          <div className="novos-card"><span>Ocupação — diferença trimestral</span><strong>{diferencaExata(analise.ocupacao.trimestral)}</strong><small>{analise.trimestreAnteriorLabel ? `Vs. ${analise.trimestreAnteriorLabel}` : 'Sem comparação'}</small></div>
          <div className="novos-card"><span>Rendimento — diferença trimestral</span><strong>{diferencaExata(analise.rendimento.trimestral)}</strong><small>{analise.trimestreAnteriorLabel ? `Vs. ${analise.trimestreAnteriorLabel}` : 'Sem comparação'}</small></div>
        </div>
        <p className="novos-nota">Atividade selecionada: <strong>{nomeSetor}</strong>. As diferenças trimestrais comparam apenas trimestres consecutivos e consultam a série histórica completa quando necessário.</p>
        <DestaquesOcupacaoRendimento analise={analise} nomeSetor={nomeSetor} tipoRanking={tipoRanking} ranking={ranking} />
        {serie.length === 0 ? <p className="novos-estado">Não há registros para os filtros selecionados.</p> : <>
          <GraficoEvolucao titulo="Evolução trimestral — ocupação" descricao="Valor informado na base de pessoas ocupadas; unidade ainda não confirmada." dados={serie} campo="ocupacaoValor" cor="#2563eb" />
          <GraficoEvolucao titulo="Evolução trimestral — rendimento efetivo" descricao="Valor informado na base de rendimento; unidade ainda não confirmada." dados={serie} campo="rendimentoValor" cor="#0f766e" />
          <article className="novos-card-grafico">
            <div className="novos-linha-titulo">
              <div>
                <h3>Comparação entre atividades econômicas</h3>
                <p>Valores do último trimestre selecionado: {ultimo?.extenso}. Categorias não aditivas.</p>
              </div>
              <div className="novos-alternancia" role="group" aria-label="Medida para comparar atividades">
                <button type="button" className={tipoRanking === 'ocupacao' ? 'selecionado' : ''} onClick={() => setTipoRanking('ocupacao')}>Ocupação</button>
                <button type="button" className={tipoRanking === 'rendimento' ? 'selecionado' : ''} onClick={() => setTipoRanking('rendimento')}>Rendimento</button>
              </div>
            </div>
            {ranking.length ? (
              <div className="novos-barras-scroll">
                <div style={{ height: Math.max(350, ranking.length * 37 + 44), minWidth: 590 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ranking} layout="vertical" margin={{ top: 5, right: 34, bottom: 5, left: 8 }}>
                      <CartesianGrid stroke="#e1eaf5" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} tickFormatter={formatarValor} />
                      <YAxis type="category" dataKey="curto" width={195} tick={{ fill: '#334155', fontSize: 11 }} />
                      <Tooltip labelFormatter={(_, itens) => itens?.[0]?.payload?.nome || ''} formatter={(valor) => [tooltipNumerico(valor), tipoRanking === 'ocupacao' ? 'Ocupação' : 'Rendimento']} />
                      <Bar dataKey="valor" fill={tipoRanking === 'ocupacao' ? '#2563eb' : '#0f766e'} radius={[0, 5, 5, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : <p className="novos-estado">Não há valores válidos nesse trimestre para a comparação.</p>}
          </article>
          <article className="novos-card-grafico">
            <h3>Valores por trimestre — {nomeSetor}</h3>
            <div className="novos-tabela-scroll">
              <table>
                <thead><tr><th>Período</th><th>Ocupação</th><th>Rendimento</th></tr></thead>
                <tbody>{[...serie].reverse().map((d) => <tr key={d.periodo}><td>{d.extenso}</td><td>{formatarValor(d.ocupacaoValor)}</td><td>{formatarValor(d.rendimentoValor)}</td></tr>)}</tbody>
              </table>
            </div>
          </article>
        </>}
      </>}
    </section>
  )
}