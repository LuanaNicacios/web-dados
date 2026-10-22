import { fetchApiProtegida } from '../../../../services/apiProtegida'
import React, { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import { normalizarSeguros, obterResumoSeguros } from './analisesSeguros.mjs'
import './DashboardSeguros.css'

const API_URL = 'http://127.0.0.1:3001/api/seguros'
const FORMATAR = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const FORMATAR_EIXO = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

const valorTexto = (n) => n === null || n === undefined ? 'Sem informação' : FORMATAR.format(n)
const diferencaTexto = (comparacao) => comparacao === null
  ? 'Comparação indisponível'
  : `${comparacao.diferenca > 0 ? '+' : ''}${valorTexto(comparacao.diferenca)}`

function GraficoSeguros({ titulo, descricao, dados, campo, cor, ano }) {
  const possuiValores = dados.some((item) => item[campo] !== null)
  const largura = ano === 'todos' ? Math.max(760, dados.length * 23) : 740

  return (
    <article className="seguros-bloco">
      <h3>{titulo}</h3>
      <p>{descricao}</p>
      {!possuiValores ? (
        <p className="seguros-estado">Não há valores disponíveis no período selecionado.</p>
      ) : (
        <div className="seguros-grafico-rolagem" role="region" aria-label={`Gráfico: ${titulo}`} tabIndex={0}>
          <div className="seguros-grafico" style={{ minWidth: largura }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados} margin={{ top: 15, right: 22, bottom: 9, left: 12 }}>
                <CartesianGrid stroke="#dfe8f4" strokeDasharray="3 4" />
                <XAxis dataKey="rotulo" minTickGap={26} tick={{ fill: '#425772', fontSize: 12 }} />
                <YAxis width={76} tickFormatter={(n) => FORMATAR_EIXO.format(n)} tick={{ fill: '#425772', fontSize: 12 }} domain={['auto', 'auto']} />
                <Tooltip
                  labelFormatter={(_rotulo, itens) => itens?.[0]?.payload?.extenso ?? ''}
                  formatter={(n) => [valorTexto(n), titulo]}
                  contentStyle={{ borderRadius: 10, borderColor: '#cbd9ed' }}
                />
                <ReferenceLine y={0} stroke="#72849c" strokeDasharray="4 4" />
                <Line
                  type="linear"
                  dataKey={campo}
                  name={titulo}
                  stroke={cor}
                  strokeWidth={2.7}
                  dot={dados.length <= 24 ? { r: 3 } : false}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {ano === 'todos' && <p className="seguros-nota">Histórico completo: role horizontalmente para explorar os meses.</p>}
    </article>
  )
}

function TextoDiferenca({ nome, valor, periodo }) {
  return (
    <p>
      <strong>{nome}:</strong> {diferencaTexto(valor)}
      {valor && <span className="seguros-nota"> — referência: {periodo} versus {valor.referencia}</span>}
    </p>
  )
}

export default function DashboardSeguros() {
  const [historico, setHistorico] = useState([])
  const [ano, setAno] = useState('automatico')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [atualizacao, setAtualizacao] = useState(0)

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
        const conteudo = await resposta.json()
        const dados = normalizarSeguros(conteudo)
        if (!controlador.signal.aborted) {
          setHistorico(dados)
          setAno((atual) => atual === 'automatico' ? String(dados.at(-1)?.ano ?? 'todos') : atual)
        }
      } catch (falha) {
        if (controlador.signal.aborted) return
        console.error('Falha ao carregar seguros:', falha.message)
        setErro('Não foi possível consultar Seguros. Confira a VPN, o backend e a rota /api/seguros.')
      } finally {
        if (!controlador.signal.aborted) setCarregando(false)
      }
    }
    carregar()
    return () => controlador.abort()
  }, [atualizacao])

  const anos = useMemo(() => [...new Set(historico.map((item) => item.ano))].sort((a, b) => a - b), [historico])
  const selecionados = useMemo(() => historico.filter((item) => ano === 'todos' || ano === 'automatico' || item.ano === Number(ano)), [historico, ano])
  const resumo = useMemo(() => obterResumoSeguros(historico, selecionados), [historico, selecionados])

  return (
    <section className="seguros-dashboard" aria-labelledby="seguros-titulo">
      <header className="seguros-cabecalho">
        <div>
          <span className="seguros-etiqueta">Demonstração local — PostgreSQL</span>
          <h2 id="seguros-titulo">Mercado de Seguros</h2>
          <p>Séries históricas de prêmio direto e sinistro direto da tabela <strong>pib.seguros</strong>.</p>
        </div>
        <button type="button" className="seguros-atualizar" onClick={() => setAtualizacao((n) => n + 1)} disabled={carregando}>
          {carregando ? 'Consultando…' : 'Atualizar dados'}
        </button>
      </header>

      <p className="seguros-aviso">
        Os conceitos, as unidades e os ajustes contábeis precisam ser confirmados pela equipe de dados.
        Os valores são exibidos na escala original da base, <strong>sem assumir R$</strong>.
        Os sinistros negativos são preservados; não calculamos sinistralidade ou projeções.
      </p>

      {erro && <p className="seguros-erro" role="alert">{erro}</p>}
      {carregando && <p className="seguros-estado" role="status">Consultando o banco de dados…</p>}
      {!carregando && !erro && (
        <>
          <div className="seguros-filtros">
            <label htmlFor="seguros-ano">Ano da análise
              <select id="seguros-ano" value={ano} onChange={(evento) => setAno(evento.target.value)}>
                <option value="todos">Todos os anos (visão histórica)</option>
                {anos.map((item) => <option key={item} value={String(item)}>{item}</option>)}
              </select>
            </label>
            <div className="seguros-filtro-info">
              <strong>Cobertura da base</strong>
              <span>{historico[0]?.extenso ?? '—'} a {historico.at(-1)?.extenso ?? '—'}</span>
            </div>
          </div>

          <div className="seguros-indicadores">
            <div className="seguros-indicador"><span>Prêmio — último valor</span><strong>{valorTexto(resumo.ultimoPremio?.premio)}</strong><small>{resumo.ultimoPremio?.extenso ?? '—'}</small></div>
            <div className="seguros-indicador"><span>Sinistro — último valor</span><strong>{valorTexto(resumo.ultimoSinistro?.sinistro)}</strong><small>{resumo.ultimoSinistro?.extenso ?? '—'}</small></div>
            <div className="seguros-indicador"><span>Meses selecionados</span><strong>{resumo.totalMeses}</strong><small>Registros da base</small></div>
            <div className="seguros-indicador seguros-indicador-atencao"><span>Sinistros negativos</span><strong>{resumo.sinistrosNegativos.length}</strong><small>No período filtrado</small></div>
          </div>

          {selecionados.length ? (
            <>
              <GraficoSeguros titulo="Evolução do prêmio direto" descricao="Série mensal na unidade original informada pela base." dados={selecionados} campo="premio" cor="#2466DB" ano={ano} />
              <GraficoSeguros titulo="Evolução do sinistro direto" descricao="Série mensal com negativos preservados. Valores extremos podem ampliar a escala vertical." dados={selecionados} campo="sinistro" cor="#0A8A83" ano={ano} />

              <article className="seguros-destaques">
                <div className="seguros-titulo-destaques">
                  <h3>Destaques e pontos de atenção</h3>
                  <span>{ano === 'todos' ? 'Histórico completo' : `Ano de ${ano}`}</span>
                </div>
                <div className="seguros-destaques-grid">
                  <section>
                    <h4>Prêmio direto</h4>
                    <TextoDiferenca nome="Diferença em relação ao mês anterior" valor={resumo.premioMensal} periodo={resumo.ultimoPremio?.extenso} />
                    <TextoDiferenca nome="Diferença interanual" valor={resumo.premioInteranual} periodo={resumo.ultimoPremio?.extenso} />
                    <p><strong>Maior valor:</strong> {valorTexto(resumo.premioMax?.premio)} ({resumo.premioMax?.extenso ?? '—'}).</p>
                    <p><strong>Menor valor:</strong> {valorTexto(resumo.premioMin?.premio)} ({resumo.premioMin?.extenso ?? '—'}).</p>
                  </section>
                  <section>
                    <h4>Sinistro direto</h4>
                    <TextoDiferenca nome="Diferença em relação ao mês anterior" valor={resumo.sinistroMensal} periodo={resumo.ultimoSinistro?.extenso} />
                    <TextoDiferenca nome="Diferença interanual" valor={resumo.sinistroInteranual} periodo={resumo.ultimoSinistro?.extenso} />
                    <p><strong>Maior valor:</strong> {valorTexto(resumo.sinistroMax?.sinistro)} ({resumo.sinistroMax?.extenso ?? '—'}).</p>
                    <p><strong>Menor valor:</strong> {valorTexto(resumo.sinistroMin?.sinistro)} ({resumo.sinistroMin?.extenso ?? '—'}).</p>
                  </section>
                </div>
                {resumo.sinistrosNegativos.length > 0 ? (
                  <div className="seguros-alerta" role="note">
                    <strong>Registros negativos que exigem contextualização</strong>
                    <p>Identificamos {resumo.sinistrosNegativos.length} mês(es) com sinistro direto negativo no filtro. Não foram removidos nem transformados em zero.</p>
                    <ul>{resumo.sinistrosNegativos.map((item) => <li key={item.periodo}>{item.extenso}: {valorTexto(item.sinistro)}</li>)}</ul>
                  </div>
                ) : (
                  <p className="seguros-nota">Não há sinistros negativos nos meses selecionados. No histórico completo, há registros que requerem validação.</p>
                )}
                {(resumo.premiosAusentes > 0 || resumo.sinistrosAusentes > 0) && (
                  <p className="seguros-nota">Valores ausentes: {resumo.premiosAusentes} em prêmio e {resumo.sinistrosAusentes} em sinistro.</p>
                )}
                <p className="seguros-nota">As diferenças são subtrações aritméticas entre meses, não taxas percentuais. Comparações usam o mês anterior real e o mesmo mês do ano anterior, inclusive fora do filtro de ano.</p>
              </article>

              <article className="seguros-bloco">
                <h3>Valores mensais</h3>
                <p>Consulta dos registros originais convertidos para apresentação com duas casas decimais.</p>
                <div className="seguros-tabela-scroll">
                  <table>
                    <thead><tr><th>Período</th><th>Prêmio direto</th><th>Sinistro direto</th></tr></thead>
                    <tbody>{[...selecionados].reverse().map((linha) => (
                      <tr key={linha.periodo} className={linha.sinistro !== null && linha.sinistro < 0 ? 'seguros-linha-negativa' : undefined}>
                        <td>{linha.extenso}</td><td>{valorTexto(linha.premio)}</td><td>{valorTexto(linha.sinistro)}{linha.sinistro !== null && linha.sinistro < 0 ? ' · atenção' : ''}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </article>
            </>
          ) : <p className="seguros-estado">Não há registros para o período selecionado.</p>}
        </>
      )}
    </section>
  )
}
