import { fetchApiProtegida } from '../../../../services/apiProtegida'
import React, { useEffect, useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import './DashboardMercadoTrabalho.css'
import { criarAnalisesMercadoTrabalho } from './analisesMercadoTrabalho.mjs'

// Somente desenvolvimento local. Nunca apontar GitHub Pages para a API da VPN.
const API_URL = 'http://127.0.0.1:3001/api/mercado-trabalho'
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const formatarNumero = (valor) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(valor)
const formatarSaldo = (valor) => `${valor > 0 ? '+' : ''}${formatarNumero(valor)}`
const nomeCurto = (nome, limite = 25) => nome.length > limite ? `${nome.slice(0, limite - 1)}…` : nome

function lerMes(valor) {
  const texto = String(valor ?? '')
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(texto)) return null
  const ano = Number(texto.slice(0, 4))
  const mes = Number(texto.slice(5, 7))
  return { ano, mes, rotulo: `${MESES[mes - 1]}/${String(ano).slice(-2)}` }
}

function verificarDados(conteudo) {
  if (conteudo?.status !== 'sucesso' || !Array.isArray(conteudo.dados)) {
    throw new Error('Resposta inesperada da API')
  }
  const dados = conteudo.dados.map((item) => {
    const calendario = lerMes(item.mes)
    if (!calendario || typeof item.secao !== 'string' || typeof item.nome !== 'string') {
      throw new Error('Mês ou seção inválidos')
    }
    const admitidos = Number(item.admitidos)
    const desligados = Number(item.desligados)
    if (![admitidos, desligados].every((n) => Number.isSafeInteger(n) && n >= 0)) {
      throw new Error('Admissões ou desligamentos inválidos')
    }
    return {
      mesCodigo: item.mes,
      secao: item.secao,
      nome: item.nome,
      ...calendario,
      admitidos,
      desligados,
      saldo: admitidos - desligados
    }
  })
  dados.sort((a, b) => a.mesCodigo.localeCompare(b.mesCodigo) || a.secao.localeCompare(b.secao))
  return dados
}

export default function DashboardMercadoTrabalho() {
  const [registros, setRegistros] = useState([])
  const [ano, setAno] = useState('todos')
  const [mes, setMes] = useState('todos')
  const [secao, setSecao] = useState('todas')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [recarregar, setRecarregar] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function consultar() {
      setCarregando(true)
      setErro('')
      if (!import.meta.env.DEV) {
        setErro('Dashboard disponível apenas no ambiente local de desenvolvimento.')
        setCarregando(false)
        return
      }
      try {
        const resposta = await fetchApiProtegida(API_URL, { signal: controller.signal, cache: 'no-store' })
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        const conteudo = await resposta.json()
        const dados = verificarDados(conteudo)
        if (!controller.signal.aborted) setRegistros(dados)
      } catch (falha) {
        if (controller.signal.aborted) return
        console.error('Erro ao carregar Mercado de Trabalho:', falha.message)
        setErro('Não foi possível carregar os dados. Confira a VPN, o backend e a rota /api/mercado-trabalho.')
      } finally {
        if (!controller.signal.aborted) setCarregando(false)
      }
    }
    consultar()
    return () => controller.abort()
  }, [recarregar])

  const anos = useMemo(() => [...new Set(registros.map((item) => item.ano))].sort((a, b) => a - b), [registros])
  const secoes = useMemo(() => {
    const mapa = new Map()
    registros.forEach(({ secao: codigo, nome }) => mapa.set(codigo, nome))
    return [...mapa].sort((a, b) => a[0].localeCompare(b[0]))
  }, [registros])

  const filtrados = useMemo(() => registros.filter((item) => (
    (ano === 'todos' || item.ano === Number(ano)) &&
    (mes === 'todos' || item.mes === Number(mes)) &&
    (secao === 'todas' || item.secao === secao)
  )), [registros, ano, mes, secao])

  const resumo = useMemo(() => filtrados.reduce((total, item) => ({
    admitidos: total.admitidos + item.admitidos,
    desligados: total.desligados + item.desligados,
    saldo: total.saldo + item.saldo
  }), { admitidos: 0, desligados: 0, saldo: 0 }), [filtrados])

  const evolucao = useMemo(() => {
    const mapa = new Map()
    filtrados.forEach((item) => {
      const atual = mapa.get(item.mesCodigo) ?? {
        mesCodigo: item.mesCodigo, rotulo: item.rotulo,
        admitidos: 0, desligados: 0, saldo: 0
      }
      atual.admitidos += item.admitidos
      atual.desligados += item.desligados
      atual.saldo += item.saldo
      mapa.set(item.mesCodigo, atual)
    })
    return [...mapa.values()].sort((a, b) => a.mesCodigo.localeCompare(b.mesCodigo))
  }, [filtrados])

  const porSecao = useMemo(() => {
    const mapa = new Map()
    filtrados.forEach((item) => {
      const atual = mapa.get(item.secao) ?? { secao: item.secao, nome: item.nome, saldo: 0, admitidos: 0, desligados: 0 }
      atual.saldo += item.saldo
      atual.admitidos += item.admitidos
      atual.desligados += item.desligados
      mapa.set(item.secao, atual)
    })
    return [...mapa.values()].sort((a, b) => b.saldo - a.saldo)
  }, [filtrados])

  const cobertura = useMemo(() => {
    const porMes = new Map()
    registros.forEach((item) => {
      if (!porMes.has(item.mesCodigo)) porMes.set(item.mesCodigo, new Set())
      porMes.get(item.mesCodigo).add(item.secao)
    })
    return [...porMes].filter(([, lista]) => lista.size < secoes.length)
      .map(([codigo, lista]) => `${codigo}: ${lista.size}/${secoes.length} seções`)
  }, [registros, secoes])

  const analises = useMemo(() => criarAnalisesMercadoTrabalho({
    evolucao, porSecao, resumo, secaoSelecionada: secao
  }), [evolucao, porSecao, resumo, secao])

  return (
    <section className="trabalho-dashboard" aria-labelledby="trabalho-titulo">
      <div className="trabalho-topo">
        <div>
          <span className="trabalho-etiqueta">Demonstração local — PostgreSQL</span>
          <h2 id="trabalho-titulo">Mercado de Trabalho — CAGED</h2>
          <p>Admissões, desligamentos e saldo por atividade econômica.</p>
        </div>
        <button type="button" className="trabalho-botao" disabled={carregando}
          onClick={() => setRecarregar((n) => n + 1)}>
          {carregando ? 'Consultando...' : 'Atualizar dados'}
        </button>
      </div>

      <p className="trabalho-aviso">
        Fonte: PostgreSQL — <strong>pib.caged_movimentacoes_secao</strong>.
        O saldo é calculado como admissões menos desligamentos. Resultados correspondem aos registros disponíveis;
        a abrangência e eventuais ausências devem ser validadas pela equipe de dados.
      </p>

      {erro && <p className="trabalho-erro" role="alert">{erro}</p>}
      {carregando && <p className="trabalho-mensagem">Consultando informações do CAGED...</p>}

      {!carregando && !erro && (
        <>
          <div className="trabalho-filtros">
            <label>Ano
              <select value={ano} onChange={(e) => setAno(e.target.value)}>
                <option value="todos">Todos os anos</option>
                {anos.map((item) => <option value={String(item)} key={item}>{item}</option>)}
              </select>
            </label>
            <label>Mês
              <select value={mes} onChange={(e) => setMes(e.target.value)}>
                <option value="todos">Todos os meses</option>
                {MESES.map((nome, i) => <option key={nome} value={String(i + 1)}>{nome}</option>)}
              </select>
            </label>
            <label>Atividade econômica
              <select value={secao} onChange={(e) => setSecao(e.target.value)}>
                <option value="todas">Todas as seções CNAE</option>
                {secoes.map(([codigo, nome]) => <option key={codigo} value={codigo}>{codigo} — {nome}</option>)}
              </select>
            </label>
          </div>

          {cobertura.length > 0 && (
            <p className="trabalho-nota">Atenção: há meses com seções CNAE não registradas na base ({cobertura.join('; ')}).
              As ausências não são tratadas como zero.</p>
          )}

          {filtrados.length > 0 ? (
            <>
              <div className="trabalho-cards">
                <div><span>Admissões</span><strong>{formatarNumero(resumo.admitidos)}</strong></div>
                <div><span>Desligamentos</span><strong>{formatarNumero(resumo.desligados)}</strong></div>
                <div><span>Saldo de empregos</span><strong className={resumo.saldo < 0 ? 'trabalho-negativo' : 'trabalho-positivo'}>{formatarNumero(resumo.saldo)}</strong></div>
                <div><span>Meses com registros</span><strong>{evolucao.length}</strong></div>
              </div>

              {analises && (
                <section className="trabalho-analises" aria-labelledby="trabalho-analises-titulo" aria-live="polite">
                  <div className="trabalho-analises-cabecalho">
                    <div>
                      <span className="trabalho-analises-etiqueta">Leitura automática dos dados</span>
                      <h3 id="trabalho-analises-titulo">Destaques do período selecionado</h3>
                      <p>Resultados descritivos recalculados quando os filtros mudam.</p>
                    </div>
                    <span className="trabalho-analises-periodo">
                      {analises.periodoInicial.mesCodigo === analises.periodoFinal.mesCodigo
                        ? analises.periodoInicial.mesCodigo
                        : `${analises.periodoInicial.mesCodigo} a ${analises.periodoFinal.mesCodigo}`}
                    </span>
                  </div>

                  <div className="trabalho-analises-metricas">
                    <article className={`trabalho-analise-metrica trabalho-tom-${analises.naturezaSaldo}`}>
                      <span>Saldo acumulado dos registros</span>
                      <strong>{formatarSaldo(analises.saldo)}</strong>
                      <small>Admissões menos desligamentos</small>
                    </article>
                    <article className="trabalho-analise-metrica">
                      <span>Mais admissões em um mês</span>
                      <strong>{formatarNumero(analises.maiorAdmissao.admitidos)}</strong>
                      <small>{analises.maiorAdmissao.rotulo}</small>
                    </article>
                    <article className="trabalho-analise-metrica">
                      <span>Mais desligamentos em um mês</span>
                      <strong>{formatarNumero(analises.maiorDesligamento.desligados)}</strong>
                      <small>{analises.maiorDesligamento.rotulo}</small>
                    </article>
                    <article className="trabalho-analise-metrica">
                      <span>Maior saldo mensal registrado</span>
                      <strong className={analises.maiorSaldoMensal.saldo < 0 ? 'trabalho-negativo' : 'trabalho-positivo'}>
                        {formatarSaldo(analises.maiorSaldoMensal.saldo)}
                      </strong>
                      <small>{analises.maiorSaldoMensal.rotulo}</small>
                    </article>
                  </div>

                  <div className="trabalho-analises-leituras">
                    <article className="trabalho-analise-leitura">
                      <h4>Leitura do saldo</h4>
                      <p>
                        {analises.naturezaSaldo === 'positivo'
                          ? 'O total de admissões supera o de desligamentos'
                          : analises.naturezaSaldo === 'negativo'
                            ? 'O total de desligamentos supera o de admissões'
                            : 'Admissões e desligamentos apresentam totais iguais'}
                        {' '}nos registros e filtros selecionados.
                      </p>
                      <p>
                        O menor saldo mensal observado foi <strong>{formatarSaldo(analises.menorSaldoMensal.saldo)}</strong>
                        {' '}em <strong>{analises.menorSaldoMensal.rotulo}</strong>.
                      </p>
                    </article>

                    <article className="trabalho-analise-leitura">
                      <h4>{analises.compararSecoes ? 'Comparação entre atividades' : 'Comparação dos períodos'}</h4>
                      {analises.compararSecoes ? (
                        <>
                          <p>Maior saldo setorial: <strong>{analises.maiorSaldoSecao.nome}</strong>
                            {' '}({analises.maiorSaldoSecao.secao}), com <strong>{formatarSaldo(analises.maiorSaldoSecao.saldo)}</strong>.
                          </p>
                          <p>Menor saldo setorial: <strong>{analises.menorSaldoSecao.nome}</strong>
                            {' '}({analises.menorSaldoSecao.secao}), com <strong>{formatarSaldo(analises.menorSaldoSecao.saldo)}</strong>.
                          </p>
                        </>
                      ) : analises.diferencaSaldoExtremos !== null ? (
                        <p>A diferença entre os saldos de <strong>{analises.periodoFinal.rotulo}</strong>
                          {' '}e <strong>{analises.periodoInicial.rotulo}</strong> é de
                          {' '}<strong>{formatarSaldo(analises.diferencaSaldoExtremos)}</strong>.
                          {' '}Isso compara os extremos exibidos, não uma variação mensal contínua.
                        </p>
                      ) : (
                        <p>Somente um mês possui registros nos filtros atuais. Não há outro período para comparação.</p>
                      )}
                    </article>
                  </div>

                  <p className="trabalho-analises-ressalva">
                    <strong>Interpretação e limites:</strong> os destaques usam exclusivamente os registros disponíveis
                    {' '}({analises.mesesComRegistro} mês(es) e {analises.secoesRepresentadas} seção(ões) CNAE representada(s)
                    {' '}nos filtros atuais). Não representam o estoque de empregos nem comprovam causas das variações.
                    {' '}Meses ou seções ausentes não são preenchidos com zero.
                  </p>
                </section>
              )}

              <div className="trabalho-grafico-card">
                <h3>Evolução mensal do emprego formal</h3>
                <p>Admissões, desligamentos e saldo nos períodos selecionados.</p>
                <div className="trabalho-grafico" role="img" aria-label="Evolução mensal de admissões, desligamentos e saldo">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={evolucao} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rotulo" minTickGap={22} tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={formatarNumero} width={64} tick={{ fontSize: 10 }} />
                      <Tooltip labelFormatter={(_label, itens) => itens?.[0]?.payload?.mesCodigo ?? _label} formatter={(valor, nome) => [formatarNumero(valor), nome]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <ReferenceLine y={0} stroke="#718096" />
                      <Bar dataKey="admitidos" name="Admissões" fill="#2563eb" maxBarSize={22} isAnimationActive={false} />
                      <Bar dataKey="desligados" name="Desligamentos" fill="#93a9c7" maxBarSize={22} isAnimationActive={false} />
                      <Line dataKey="saldo" name="Saldo" stroke="#059669" strokeWidth={2.5} dot={evolucao.length <= 18} isAnimationActive={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="trabalho-grafico-card">
                <h3>Saldo por atividade econômica</h3>
                <p>Comparação entre as seções CNAE para o período selecionado. Valores negativos representam mais desligamentos do que admissões.</p>
                <div className="trabalho-grafico-rolagem">
                  <div className="trabalho-grafico-barras" style={{ height: Math.max(270, porSecao.length * 40 + 55) }} role="img" aria-label="Saldo de empregos por seção CNAE">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={porSecao.map((item) => ({ ...item, rotuloSecao: `${item.secao} · ${nomeCurto(item.nome)}` }))} layout="vertical" margin={{ top: 10, right: 18, left: 2, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickFormatter={formatarNumero} tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="rotuloSecao" width={158} tick={{ fontSize: 11 }} />
                        <ReferenceLine x={0} stroke="#718096" />
                        <Tooltip labelFormatter={(_rotulo, itens) => itens?.[0]?.payload?.nome ?? _rotulo}
                          formatter={(valor) => [formatarSaldo(valor), 'Saldo']} />
                        <Bar dataKey="saldo" name="Saldo" fill="#2563eb" radius={[0, 3, 3, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="trabalho-nota">Os rótulos identificam o código e o nome abreviado da seção CNAE. Passe o cursor sobre a barra para ler o nome completo.</p>
              </div>

              <div className="trabalho-tabela-card">
                <h3>Movimentações por mês</h3>
                <div className="trabalho-tabela-scroll">
                  <table>
                    <thead><tr><th>Mês</th><th>Admissões</th><th>Desligamentos</th><th>Saldo</th></tr></thead>
                    <tbody>
                      {evolucao.map((item) => (
                        <tr key={item.mesCodigo}>
                          <td>{item.mesCodigo}</td>
                          <td>{formatarNumero(item.admitidos)}</td>
                          <td>{formatarNumero(item.desligados)}</td>
                          <td>{formatarNumero(item.saldo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : <p className="trabalho-mensagem">Não existem registros para os filtros selecionados. Nenhum valor foi preenchido artificialmente.</p>}
        </>
      )}
    </section>
  )
}
