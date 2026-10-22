import { fetchApiProtegida } from '../../../../services/apiProtegida'
import React, { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import './DashboardSaude.css'

// Somente desenvolvimento local, antes da implantação institucional e autorização na API.
const API_URL = 'http://127.0.0.1:3001/api/saude'
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const numeroBR = (valor, casas = 0) =>
  valor === null || valor === undefined
    ? 'Sem informação'
    : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: casas }).format(valor)

function validarLista(lista) {
  if (!Array.isArray(lista)) throw new Error('Lista de dados inválida')
  const vistos = new Set()
  return lista.map((linha) => {
    const { periodo, ano, mes, valor, quantidade } = linha
    if (typeof periodo !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo) ||
        Number(periodo.slice(0, 4)) !== ano || Number(periodo.slice(5, 7)) !== mes ||
        vistos.has(periodo)) throw new Error('Período duplicado ou inválido')
    if ((valor !== null && (typeof valor !== 'number' || !Number.isFinite(valor))) ||
        (quantidade !== null && (!Number.isSafeInteger(quantidade) || quantidade < 0))) {
      throw new Error('Medida fora do formato esperado')
    }
    vistos.add(periodo)
    return {
      periodo, ano, mes, valor, quantidade,
      rotulo: `${MESES[mes - 1]}/${String(ano).slice(-2)}`,
      extenso: `${MESES[mes - 1]}/${ano}`
    }
  }).sort((a, b) => a.periodo.localeCompare(b.periodo))
}

function dadosAnteriores(periodos, atual) {
  if (!atual) return { anterior: null, anoAnterior: null }
  const anteriorMes = atual.mes === 1
    ? `${atual.ano - 1}-12`
    : `${atual.ano}-${String(atual.mes - 1).padStart(2, '0')}`
  const anoAnterior = `${atual.ano - 1}-${String(atual.mes).padStart(2, '0')}`
  return {
    anterior: periodos.find((item) => item.periodo === anteriorMes) ?? null,
    anoAnterior: periodos.find((item) => item.periodo === anoAnterior) ?? null
  }
}

function mudanca(atual, anterior, casas = 0) {
  if (atual === null || anterior === null || atual === undefined || anterior === undefined) return 'Indisponível'
  const delta = atual - anterior
  return `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${numeroBR(Math.abs(delta), casas)}`
}

function Cartao({ titulo, valor, complemento, variante = '' }) {
  return <div className={`saude-kpi ${variante}`}>
    <span>{titulo}</span>
    <strong>{valor}</strong>
    {complemento && <small>{complemento}</small>}
  </div>
}

function Grafico({ titulo, descricao, dados, campo, cor, casas = 0 }) {
  return <article className="saude-painel">
    <h3>{titulo}</h3>
    <p>{descricao}</p>
    {dados.length === 0 ? <p className="saude-vazio">Sem registros para este período.</p> :
      <div className="saude-grafico">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 10, right: 18, bottom: 8, left: 5 }}>
            <CartesianGrid stroke="#dce7f4" strokeDasharray="3 3" />
            <XAxis dataKey="rotulo" minTickGap={25} tick={{ fill: '#36516f', fontSize: 12 }} />
            <YAxis width={84} tick={{ fill: '#36516f', fontSize: 11 }}
              tickFormatter={(v) => numeroBR(v >= 1000000 ? v / 1000000 : v, v >= 1000000 ? 1 : 0) + (v >= 1000000 ? ' mi' : '')} />
            <Tooltip labelFormatter={(_, itens) => itens?.[0]?.payload?.extenso ?? ''}
              formatter={(v) => [numeroBR(v, casas), titulo]} />
            <Line type="linear" dataKey={campo} stroke={cor} strokeWidth={3}
              dot={{ r: 3 }} activeDot={{ r: 6 }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>}
  </article>
}

export default function DashboardSaude() {
  const [aba, setAba] = useState('hospitalar')
  const [base, setBase] = useState({ ambulatorial: [], hospitalar: [] })
  const [ano, setAno] = useState('todos')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [atualizar, setAtualizar] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()
    async function buscar() {
      setCarregando(true)
      setErro('')
      if (!import.meta.env.DEV) {
        setErro('Este painel é exclusivo do ambiente local de desenvolvimento.')
        setCarregando(false)
        return
      }
      try {
        const resposta = await fetchApiProtegida(API_URL, { signal: controlador.signal, cache: 'no-store' })
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        const json = await resposta.json()
        if (json.status !== 'sucesso' || !json.ambulatorial || !json.hospitalar) {
          throw new Error('Formato inesperado da API')
        }
        const ambulatorial = validarLista(json.ambulatorial.dados)
        const hospitalar = validarLista(json.hospitalar.dados)
        if (!controlador.signal.aborted) setBase({ ambulatorial, hospitalar })
      } catch (falha) {
        if (controlador.signal.aborted) return
        console.error('Falha ao carregar dados de Saúde:', falha.message)
        setErro('Não foi possível consultar Saúde. Confira VPN, backend e a rota /api/saude.')
      } finally {
        if (!controlador.signal.aborted) setCarregando(false)
      }
    }
    buscar()
    return () => controlador.abort()
  }, [atualizar])

  const anos = useMemo(() => [...new Set(base.hospitalar.map((d) => d.ano))].sort(), [base.hospitalar])
  const hospitalFiltrado = useMemo(() => base.hospitalar.filter((d) => ano === 'todos' || d.ano === Number(ano)), [base.hospitalar, ano])
  const ultimoHospital = hospitalFiltrado.at(-1) ?? null
  const periodosComparacao = dadosAnteriores(base.hospitalar, ultimoHospital)
  const amb = base.ambulatorial.at(-1) ?? null
  const maiorInternacoes = hospitalFiltrado.filter((d) => d.quantidade !== null)
    .reduce((a, b) => !a || b.quantidade > a.quantidade ? b : a, null)
  const menorInternacoes = hospitalFiltrado.filter((d) => d.quantidade !== null)
    .reduce((a, b) => !a || b.quantidade < a.quantidade ? b : a, null)

  return <section className="saude-dashboard" aria-label="Indicadores de Saúde DATASUS">
    <header className="saude-topo">
      <div>
        <span className="saude-etiqueta">Demonstração local — PostgreSQL</span>
        <h2>Indicadores de Saúde — DATASUS</h2>
        <p>Dados ambulatoriais e hospitalares disponíveis no schema <strong>pib</strong>.</p>
      </div>
      <button type="button" className="saude-atualizar" disabled={carregando}
        onClick={() => setAtualizar((v) => v + 1)}>
        {carregando ? 'Consultando...' : 'Atualizar dados'}
      </button>
    </header>

    <p className="saude-aviso">As unidades dos valores e o conceito dos indicadores ainda devem ser confirmados com a equipe de dados. Quantidades aprovadas não equivalem a pacientes únicos. Não somar séries ambulatoriais e hospitalares.</p>
    {erro && <p role="alert" className="saude-erro">{erro}</p>}
    {carregando ? <p role="status" className="saude-vazio">Consultando dados de Saúde...</p> : !erro && <>
      <nav className="saude-abas" aria-label="Tipo de atendimento">
        <button type="button" className={aba === 'hospitalar' ? 'ativa' : ''}
          onClick={() => setAba('hospitalar')}>Hospitalar</button>
        <button type="button" className={aba === 'ambulatorial' ? 'ativa' : ''}
          onClick={() => setAba('ambulatorial')}>Ambulatorial</button>
      </nav>

      {aba === 'ambulatorial' ? <>
        <div className="saude-bloco-titulo">
          <h3>Atendimento ambulatorial</h3>
          <p>Fonte: <strong>pib.datasus_indicadores_ambulatorial</strong></p>
        </div>
        <div className="saude-kpis">
          <Cartao titulo="Quantidade aprovada" valor={numeroBR(amb?.quantidade)} complemento={amb?.extenso ?? 'Sem período'} />
          <Cartao titulo="Valor aprovado (unidade a confirmar)" valor={numeroBR(amb?.valor, 2)} complemento={amb?.extenso ?? 'Sem período'} variante="verde" />
          <Cartao titulo="Meses com registros" valor={numeroBR(base.ambulatorial.length)} complemento="Cobertura atual da base" />
        </div>
        <article className="saude-destaque">
          <h3>Cobertura e interpretação</h3>
          <p>A base ambulatorial possui {base.ambulatorial.length} mês(es) registrado(s).
            {base.ambulatorial.length === 1 ? ' Com apenas um mês, não é possível calcular tendências ou variações mensais.' : ' As comparações devem considerar apenas períodos realmente disponíveis.'}</p>
          <p>O campo quantidade aprovada representa o indicador disponível na base; não deve ser interpretado como número de pacientes.</p>
        </article>
      </> : <>
        <div className="saude-bloco-titulo">
          <h3>Indicadores hospitalares</h3>
          <p>Fonte: <strong>pib.datasus_indicadores_hospitalar</strong></p>
        </div>
        <div className="saude-filtros">
          <label htmlFor="saude-ano">Ano</label>
          <select id="saude-ano" value={ano} onChange={(e) => setAno(e.target.value)}>
            <option value="todos">Todos os anos</option>
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="saude-kpis">
          <Cartao titulo="Internações — último mês" valor={numeroBR(ultimoHospital?.quantidade)} complemento={ultimoHospital?.extenso ?? 'Sem período'} />
          <Cartao titulo="Valor total — último mês" valor={numeroBR(ultimoHospital?.valor, 2)} complemento="Unidade a confirmar" variante="verde" />
          <Cartao titulo="Meses com registros" valor={numeroBR(hospitalFiltrado.length)} complemento={ano === 'todos' ? 'Histórico disponível' : `Ano ${ano}`} />
          <Cartao titulo="Diferença mensal — internações" valor={mudanca(ultimoHospital?.quantidade, periodosComparacao.anterior?.quantidade)}
            complemento={periodosComparacao.anterior ? `Vs. ${periodosComparacao.anterior.extenso}` : 'Mês anterior não disponível'} variante="roxo" />
        </div>
        <Grafico titulo="Evolução das internações" descricao="Quantidade registrada em cada mês disponível." dados={hospitalFiltrado} campo="quantidade" cor="#2563eb" />
        <Grafico titulo="Evolução do valor hospitalar" descricao="Valores originais da base; unidade ainda não confirmada." dados={hospitalFiltrado} campo="valor" cor="#0f766e" casas={2} />
        <article className="saude-destaque">
          <h3>Destaques e pontos de atenção</h3>
          {ultimoHospital ? <>
            <p><strong>Último período selecionado:</strong> {ultimoHospital.extenso}, com {numeroBR(ultimoHospital.quantidade)} internações e valor registrado de {numeroBR(ultimoHospital.valor, 2)}.</p>
            <p><strong>Maior número de internações:</strong> {numeroBR(maiorInternacoes?.quantidade)} em {maiorInternacoes?.extenso}. <strong>Menor:</strong> {numeroBR(menorInternacoes?.quantidade)} em {menorInternacoes?.extenso}.</p>
            <p><strong>Diferença interanual de internações:</strong> {mudanca(ultimoHospital.quantidade, periodosComparacao.anoAnterior?.quantidade)}{periodosComparacao.anoAnterior ? ` (vs. ${periodosComparacao.anoAnterior.extenso})` : ' (mesmo mês do ano anterior indisponível)'}.</p>
          </> : <p>Não há registros com os filtros atuais.</p>}
          <p>As diferenças entre meses são aritméticas. O painel não calcula custos médios nem interpreta variações como evidência de causalidade.</p>
        </article>
        <article className="saude-painel">
          <h3>Registros hospitalares por mês</h3>
          <div className="saude-tabela-scroll">
            <table>
              <thead><tr><th>Período</th><th>Internações</th><th>Valor registrado</th></tr></thead>
              <tbody>{[...hospitalFiltrado].reverse().map((d) =>
                <tr key={d.periodo}><td>{d.extenso}</td><td>{numeroBR(d.quantidade)}</td><td>{numeroBR(d.valor, 2)}</td></tr>)}</tbody>
            </table>
          </div>
        </article>
      </>}
    </>}
  </section>
}
