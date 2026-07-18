import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AnaliseDetalhes.css'

import {
  FaArrowLeft,
  FaChartBar,
  FaInfoCircle,
  FaFileAlt,
  FaDatabase,
  FaClock,
  FaDownload,
  FaExternalLinkAlt,
  FaFilm
} from 'react-icons/fa'

const AnaliseDetalhes = () => {
  const navigate = useNavigate()

  const [secaoAtiva, setSecaoAtiva] = useState('powerbi')

  /*
    Substitua pela URL pública do seu relatório.

    No Power BI, normalmente será uma URL gerada em:
    Arquivo > Inserir relatório > Publicar na Web

    Atenção:
    "Publicar na Web" deixa o relatório acessível publicamente.
  */
  const powerBiUrl =
    'https://app.powerbi.com/reportEmbed?reportId=9b882393-a939-41d0-8962-e114c92939c3&autoAuth=true&ctid=65369057-8836-4ab5-9dec-74cfd40b94c4'

  const secoes = {
    powerbi: {
      titulo: 'Análise Power BI'
    },

    sobre: {
      titulo: 'Sobre os dados',
      conteudo:
        'Esta análise apresenta indicadores relacionados ao mercado cinematográfico, incluindo informações sobre filmes, gêneros, avaliações, lançamentos e desempenho.'
    },

    metodologia: {
      titulo: 'Metodologia',
      conteudo:
        'Os dados foram organizados, tratados e analisados para permitir a visualização dos principais indicadores do conjunto de dados.'
    },

    fonte: {
      titulo: 'Fonte',
      conteudo:
        'Informe aqui a instituição, plataforma ou base responsável pelo fornecimento dos dados utilizados nesta análise.'
    },

    atualizacoes: {
      titulo: 'Atualizações',
      conteudo:
        'Última atualização: informe aqui a data da atualização mais recente dos dados.'
    }
  }

  const handleVoltar = () => {
    navigate('/Analises')
  }

  const handleDownload = (arquivo) => {
    console.log('Download solicitado:', arquivo)
  }

  return (
    <main className="detalhes-page">

      <section className="detalhes-container">

        {/* Caminho da página */}
        <nav
          className="breadcrumb"
          aria-label="Navegação estrutural"
        >
          <span>Início</span>
          <span>/</span>
          <span>Análises</span>
          <span>/</span>
          <strong>Dados Filme</strong>
        </nav>

        {/* Cabeçalho */}
        <header className="detalhes-header">

          <button
            type="button"
            className="voltar-button"
            onClick={handleVoltar}
          >
            <FaArrowLeft />
            Voltar
          </button>

          <div className="detalhes-identificacao">

            <div className="detalhes-icon">
              <FaFilm />
            </div>

            <div className="detalhes-title-area">

              <h1>
                Análise Power BI – Filmes
              </h1>

              <p>
                Estatísticas e indicadores do mercado cinematográfico.
              </p>

              <div className="detalhes-tags">
                <span>Filme</span>
                <span>Power BI</span>
              </div>

            </div>

          </div>

        </header>

        {/* Conteúdo principal */}
        <div className="detalhes-layout">

          {/* Menu lateral */}
          <aside className="detalhes-sidebar">

            <div className="sidebar-description">

              <h2>
                Sobre os dados
              </h2>

              <p>
                Indicadores sobre o mercado cinematográfico,
                bilheteria, lançamentos, público e desempenho de filmes.
              </p>

            </div>

            <div className="sidebar-menu">

              <button
                type="button"
                className={
                  secaoAtiva === 'powerbi'
                    ? 'sidebar-item active'
                    : 'sidebar-item'
                }
                onClick={() => setSecaoAtiva('powerbi')}
              >
                <FaChartBar />
                <span>Análise Power BI</span>
              </button>

              <button
                type="button"
                className={
                  secaoAtiva === 'sobre'
                    ? 'sidebar-item active'
                    : 'sidebar-item'
                }
                onClick={() => setSecaoAtiva('sobre')}
              >
                <FaInfoCircle />
                <span>Sobre os dados</span>
              </button>

              <button
                type="button"
                className={
                  secaoAtiva === 'metodologia'
                    ? 'sidebar-item active'
                    : 'sidebar-item'
                }
                onClick={() => setSecaoAtiva('metodologia')}
              >
                <FaFileAlt />
                <span>Metodologia</span>
              </button>

              <button
                type="button"
                className={
                  secaoAtiva === 'fonte'
                    ? 'sidebar-item active'
                    : 'sidebar-item'
                }
                onClick={() => setSecaoAtiva('fonte')}
              >
                <FaDatabase />
                <span>Fonte</span>
              </button>

              <button
                type="button"
                className={
                  secaoAtiva === 'atualizacoes'
                    ? 'sidebar-item active'
                    : 'sidebar-item'
                }
                onClick={() => setSecaoAtiva('atualizacoes')}
              >
                <FaClock />
                <span>Atualizações</span>
              </button>

            </div>

          </aside>

          {/* Área central */}
          <section className="detalhes-content">

            {secaoAtiva === 'powerbi' ? (
              <div className="powerbi-card">

                <div className="powerbi-header">

                  <h2>
                    Análise Power BI
                  </h2>

                  <a
                    href={powerBiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="powerbi-external-link"
                  >
                    Abrir no Power BI
                    <FaExternalLinkAlt />
                  </a>

                </div>

                <div className="powerbi-frame-wrapper">

                  <iframe
                    title="Relatório Power BI de Filmes"
                    src={powerBiUrl}
                    allowFullScreen
                  />

                </div>

              </div>
            ) : (
              <div className="information-card">

                <h2>
                  {secoes[secaoAtiva].titulo}
                </h2>

                <p>
                  {secoes[secaoAtiva].conteudo}
                </p>

              </div>
            )}

            {/* Downloads */}
            <section className="downloads-card">

              <h2>
                Download dos dados
              </h2>

              <div className="downloads-list">

                <button
                  type="button"
                  className="download-button"
                  onClick={() => handleDownload('dados.csv')}
                >
                  <FaDownload />
                  Dados (.CSV)
                </button>

                <button
                  type="button"
                  className="download-button"
                  onClick={() => handleDownload('dados.xlsx')}
                >
                  <FaDownload />
                  Dados (.XLSX)
                </button>

                <button
                  type="button"
                  className="download-button"
                  onClick={() => handleDownload('analise.py')}
                >
                  <FaDownload />
                  Dados (.PY)
                </button>

              </div>

            </section>

          </section>

        </div>

      </section>

    </main>
  )
}

export default AnaliseDetalhes