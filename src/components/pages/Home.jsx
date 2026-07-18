import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'
import { FaSearch } from 'react-icons/fa'

const Home = () => {
  const [search, setSearch] = useState('')

  const navigate = useNavigate()

  const handleSearch = () => {
    const textoPesquisa = search.trim()

    if (textoPesquisa === '') {
      navigate('/Analises')
      return
    }

    navigate(
      `/Analises?busca=${encodeURIComponent(textoPesquisa)}`
    )
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <main className="home">

      <section className="home-hero">

        <div className="container-searchbar">

          <h1 className="datatext">
            DataSets <span>Disponíveis!</span>
          </h1>

          <p className="home-subtitle">
            Explore, analise e transforme dados em conhecimento.
          </p>

          <div className="input-wrapper">

            <input
              type="search"
              placeholder="Buscar análises, indicadores ou data sets..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Buscar datasets"
            />

            <button
              type="button"
              className="iconbox"
              onClick={handleSearch}
              aria-label="Pesquisar"
            >
              <FaSearch className="icon-pesquisa" />
            </button>

          </div>

        </div>

      </section>

    </main>
  )
}

export default Home