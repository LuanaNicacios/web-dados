import React, { useState } from 'react'
import {
  useNavigate,
  useSearchParams
} from 'react-router-dom'

import './Analises.css'

import {
  FaSearch,
  FaUsers,
  FaDatabase,
  FaFilm,
  FaChevronRight
} from 'react-icons/fa'

const Analises = () => {
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()

  const buscaRecebida = searchParams.get('busca') || ''

  const [search, setSearch] = useState(buscaRecebida)

  const analises = [
    {
      id: 1,
      titulo: 'Dados População',
      descricao:
        'Indicadores e informações sobre a população.',
      categoria: 'População',
      ferramenta: 'Power BI',
      palavrasChave:
        'habitantes pessoas demografia censo pernambuco',
      rota: '/Analises/Populacao',
      icon: <FaUsers />
    },
    {
      id: 2,
      titulo: 'Dados PIB',
      descricao:
        'Análises sobre o PIB (Produto Interno Bruto) do estado de Pernambuco.',
      categoria: 'PIB',
      ferramenta: 'Power BI',
      palavrasChave:
        'economia produto interno bruto renda pernambuco',
      rota: '/Analises/PIB',
      icon: <FaDatabase />
    },
    {
      id: 3,
      titulo: 'Dados Filme',
      descricao:
        'Estatísticas e indicadores do mercado cinematográfico.',
      categoria: 'Filme',
      ferramenta: 'Power BI',
      palavrasChave:
        'cinema filmes imdb bilheteria atores audiovisual',
      rota: '/Analises/Filmes',
      icon: <FaFilm />
    }
  ]

  const normalizarTexto = (texto = '') => {
    return String(texto)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  const textoPesquisa = normalizarTexto(search)

  const analisesFiltradas = analises.filter((analise) => {
    if (!textoPesquisa) {
      return true
    }

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
      setSearchParams({
        busca: novoTexto
      })
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
            Explore análises, indicadores e estudos de dados.
          </p>

          <div className="analises-search">

            <FaSearch
              className="search-icon-left"
              aria-hidden="true"
            />

            <input
              type="search"
              placeholder="Buscar por nome, letra, categoria ou descrição..."
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

                  <h2>
                    {analise.titulo}
                  </h2>

                  <p>
                    {analise.descricao}
                  </p>

                  <div className="analise-tags">

                    <span>
                      {analise.categoria}
                    </span>

                    <span>
                      {analise.ferramenta}
                    </span>

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

              <h2>
                Nenhuma análise encontrada
              </h2>

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