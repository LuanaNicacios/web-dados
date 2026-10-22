import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import './CatalogoDados.css'
import './PrevisaoReceitas.css'

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:3001' : '')
).replace(/\/$/, '')

export default function PrevisaoReceitas() {
  const [html, setHtml] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function carregar() {
      setCarregando(true)
      setHtml('')
      setErro('')

      try {
        const { data, error } = await supabase.auth.getSession()
        if (error || !data?.session?.access_token) {
          throw new Error('Sua sessão expirou. Entre novamente para visualizar o relatório.')
        }

        const resposta = await fetch(`${API_BASE}/api/relatorios/previsao-receitas`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${data.session.access_token}`
          },
          cache: 'no-store',
          signal: controller.signal
        })

        if (!resposta.ok) {
          const detalhe = await resposta.json().catch(() => null)
          throw new Error(detalhe?.mensagem || `Erro HTTP ${resposta.status}`)
        }

        const documento = await resposta.text()
        if (!controller.signal.aborted) setHtml(documento)
      } catch (falha) {
        if (!controller.signal.aborted) {
          setErro(falha?.message || 'Não foi possível carregar o relatório.')
        }
      } finally {
        if (!controller.signal.aborted) setCarregando(false)
      }
    }

    carregar()
    return () => controller.abort()
  }, [tentativa])

  return (
    <main className="catalogo-dados previsao-receitas">
      <Link to="/Dados" className="previsao-receitas__voltar">
        ← Voltar para Dados
      </Link>

      <header className="catalogo-dados__cabecalho previsao-receitas__cabecalho">
        <div>
          <h1>Previsão de Receitas Municipais</h1>
          <p>Relatório de previsão de receitas dos municípios de Pernambuco.</p>
        </div>
        <button
          type="button"
          onClick={() => setTentativa((valor) => valor + 1)}
          disabled={carregando}
          className="previsao-receitas__botao"
        >
          Atualizar relatório
        </button>
      </header>

      {carregando && (
        <section className="previsao-receitas__status" role="status">
          Verificando acesso e carregando o relatório...
        </section>
      )}

      {erro && (
        <section className="previsao-receitas__status previsao-receitas__status--erro" role="alert">
          <strong>Não foi possível abrir o relatório.</strong>
          <p>{erro}</p>
          <button type="button" onClick={() => setTentativa((valor) => valor + 1)}>
            Tentar novamente
          </button>
        </section>
      )}

      {!carregando && !erro && html && (
        <div className="previsao-receitas__moldura">
          {/* Sem allow-same-origin: isola o JavaScript do HTML do portal e seus tokens. */}
          <iframe
            title="Relatório de Previsão de Receitas Municipais de Pernambuco"
            srcDoc={html}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            className="previsao-receitas__iframe"
          />
        </div>
      )}
    </main>
  )
}
