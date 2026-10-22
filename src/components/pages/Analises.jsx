import React, { useState } from 'react'

import {
  useNavigate,
  useSearchParams
} from 'react-router-dom'

import {
  FaSearch,
  FaDatabase,
  FaChartLine,
  FaChevronRight
} from 'react-icons/fa'

import { useAuth } from '../../context/AuthContext'

import './Analises.css'

const Analises = () => {
  const navigate = useNavigate()

  const { isAdmin, isAnalista } = useAuth()

  const [searchParams, setSearchParams] = useSearchParams()

  const buscaRecebida = searchParams.get('busca') || ''

  const [search, setSearch] = useState(buscaRecebida)

  // Somente análises reais do portal.
  // O PIB continua restrito aos administradores.
  const analises = [
    ...(isAdmin
      ? [
          {
            id: 'pib',
            titulo: 'Dados PIB',
            descricao:
              'Indicadores econômicos de Pernambuco, incluindo agropecuária, comércio, serviços, mercado de trabalho, ocupação, rendimento, inflação, saúde e seguros.',
            categoria: 'Indicadores econômicos',
            ferramenta: 'Dashboard interativo',
            palavrasChave:
              'pib economia pernambuco agropecuaria emprego saude seguros',
            rota: '/Analises/PIB',
            icon: <FaDatabase />
          }
        ]
      : []),

...((isAdmin || isAnalista)
  ? [
      {
        id: 'previsao-receitas',
        titulo: 'Previsão de Receitas Municipais',
        descricao:
          'Relatório de previsão de receitas dos municípios de Pernambuco, com comparação de modelos, testes retroativos e avaliação da qualidade dos dados.',
        categoria: 'Receitas municipais',
        ferramenta: 'Relatório interativo',
        palavrasChave:
          'previsao receitas municipais municipios modelos arrecadacao pernambuco',
        rota: '/Dados/Previsao-Receitas',
        icon: <FaChartLine />
      }
    ]
  : [])
  ]

  const normalizarTexto = (texto = '') =>
    String(texto)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()

  const textoPesquisa = normalizarTexto(search)

  const analisesFiltradas = analises.filter((analise) => {
    if (!textoPesquisa) return true

    const conteudoPesquisavel = normalizarTexto(`
      ${analise.titulo}
      ${analise.descricao}
      ${analise.categoria}
      ${analise.ferramenta}
      ${analise.palavrasChave}
    `)

    return conteudoPesquisavel.includes(textoPesquisa)
  })

  const handleInputChange = (event) => {
    const novoTexto = event.target.value

    setSearch(novoTexto)

    if (novoTexto.trim()) {
      setSearchParams({ busca: novoTexto })
    } else {
      setSearchParams({})
    }
  }

  const handleAbrirAnalise = (analise) => {
    navigate(analise.rota)
  }

  const handleSearch = () => {
    if (analisesFiltradas.length === 1) {
      handleAbrirAnalise(analisesFiltradas[0])
    }
  }

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  const handleCardKeyDown = (event, analise) => {
    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      handleAbrirAnalise(analise)
    }
  }

  const handleLimparPesquisa = () => {
    setSearch('')
    setSearchParams({})
  }

  return (
    <main className="analises-page">
      <section className="analises-hero">
        <header className="analises-header">
          <h1 className="analises-title">
            Análises
          </h1>

          <p className="analises-subtitle">
            Explore os indicadores econômicos e relatórios
            disponíveis no portal da SEPLAG.
          </p>

          <div className="analises-search">
            <FaSearch
              className="search-icon-left"
              aria-hidden="true"
            />

            <input
              type="search"
              placeholder="Buscar por nome, categoria ou descrição..."
              value={search}
              onChange={handleInputChange}
              onKeyDown={handleSearchKeyDown}
              aria-label="Buscar análises"
            />

            <button
              type="button"
              className="search-button"
              onClick={handleSearch}
              aria-label="Pesquisar análises"
            >
              <FaSearch aria-hidden="true" />
            </button>
          </div>
        </header>

        <section
          className="analises-lista"
          aria-label="Lista de análises disponíveis"
        >
          {analisesFiltradas.length > 0 ? (
            analisesFiltradas.map((analise) => (
              <article
                key={analise.id}
                className="analise-card"
                role="link"
                tabIndex={0}
                aria-label={`Abrir ${analise.titulo}`}
                onClick={() => handleAbrirAnalise(analise)}
                onKeyDown={(event) =>
                  handleCardKeyDown(event, analise)
                }
              >
                <div
                  className="analise-icon"
                  aria-hidden="true"
                >
                  {analise.icon}
                </div>

                <div className="analise-content">
                  <h2>{analise.titulo}</h2>

                  <p>{analise.descricao}</p>

                  <div className="analise-tags">
                    <span>{analise.categoria}</span>
                    <span>{analise.ferramenta}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="analise-button"
                  aria-label={`Abrir ${analise.titulo}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleAbrirAnalise(analise)
                  }}
                >
                  <FaChevronRight aria-hidden="true" />
                </button>
              </article>
            ))
          ) : (
            <div className="analises-empty">
              <h2>Nenhuma análise encontrada</h2>

              <p>
                Não encontramos resultados para “{search}”.
              </p>

              <button
                type="button"
                className="limpar-pesquisa-button"
                onClick={handleLimparPesquisa}
              >
                Limpar pesquisa
              </button>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default Analises
