import React, { useState } from 'react'

import {
  useLocation,
  useNavigate
} from 'react-router-dom'

import './AnaliseDetalhes.css'

import {
  FaArrowLeft,
  FaChartBar,
  FaInfoCircle,
  FaFileAlt,
  FaDatabase,
  FaClock,
  FaDownload,
  FaExternalLinkAlt
} from 'react-icons/fa'

import AnalisePib from './pib/AnalisePib'


const AnaliseDetalhes = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const paginaPib =
    location.pathname
      .toLowerCase()
      .includes('/analises/pib')

  const [secaoAtiva, setSecaoAtiva] =
    useState('analise')


  const powerBiUrl =
    'https://app.powerbi.com/reportEmbed?reportId=912bb1df-2807-4f87-a102-40d60df30774&autoAuth=true&ctid=76a2ae5a-9f00-4f6b-95ed-5d33d77c4d61'


  const secoes = {
    sobre: {
      titulo: 'Sobre os dados',

      conteudo:
        'Esta análise apresenta indicadores relacionados ao Produto Interno Bruto (PIB), incluindo informações sobre crescimento econômico, participação dos setores produtivos, evolução da atividade econômica e desempenho da economia ao longo do tempo.'
    },

    metodologia: {
      titulo: 'Metodologia',

      conteudo:
        'Os dados foram organizados, tratados e analisados para permitir a visualização dos principais indicadores do conjunto de dados.'
    },

    fonte: {
      titulo: 'Fonte',

      conteudo:
        'Os indicadores desta versão demonstrativa são construídos a partir dos arquivos CSV disponibilizados para análise.'
    },

    atualizacoes: {
      titulo: 'Atualizações',

      conteudo:
        'Os dados poderão ser atualizados conforme novas versões das bases forem disponibilizadas.'
    }
  }


  const handleVoltar = () => {
    navigate('/Analises')
  }


  const handleDownload = (arquivo) => {
    console.log(
      'Download solicitado:',
      arquivo
    )
  }


  return (
    <main className="detalhes-page">

      <section className="detalhes-container">

        {/* =========================
            BREADCRUMB
        ========================= */}

        <nav
          className="breadcrumb"
          aria-label="Navegação estrutural"
        >
          <span>Início</span>

          <span>/</span>

          <span>Análises</span>

          <span>/</span>

          <strong>
            {paginaPib
              ? 'Dados PIB'
              : 'Análise'}
          </strong>
        </nav>


        {/* =========================
            CABEÇALHO
        ========================= */}

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
              <FaChartBar />
            </div>


            <div className="detalhes-title-area">

              <h1>
                {paginaPib
                  ? 'Análise do PIB e Indicadores Econômicos'
                  : 'Análise de Dados'}
              </h1>

              <p>
                {paginaPib
                  ? 'Indicadores econômicos apresentados diretamente no portal.'
                  : 'Estatísticas e indicadores dos dados disponíveis.'}
              </p>


              <div className="detalhes-tags">

                {paginaPib && (
                  <>
                    <span>PIB</span>
                    <span>Dados Econômicos</span>
                    <span>CSV</span>
                  </>
                )}

              </div>

            </div>

          </div>

        </header>


        {/* =========================
            CONTEÚDO
        ========================= */}

        <div className="detalhes-layout">


          {/* =========================
              MENU LATERAL
          ========================= */}

          <aside className="detalhes-sidebar">

            <div className="sidebar-description">

              <h2>
                Sobre os dados
              </h2>

              <p>
                Indicadores sobre o PIB,
                produção econômica,
                crescimento, participação
                dos setores e desempenho
                da economia ao longo do
                tempo.
              </p>

            </div>


            <div className="sidebar-menu">

              <button
                type="button"
                className={
                  secaoAtiva === 'analise'
                    ? 'sidebar-item active'
                    : 'sidebar-item'
                }
                onClick={() =>
                  setSecaoAtiva('analise')
                }
              >
                <FaChartBar />

                <span>
                  Análise dos dados
                </span>
              </button>


              <button
                type="button"
                className={
                  secaoAtiva === 'sobre'
                    ? 'sidebar-item active'
                    : 'sidebar-item'
                }
                onClick={() =>
                  setSecaoAtiva('sobre')
                }
              >
                <FaInfoCircle />

                <span>
                  Sobre os dados
                </span>
              </button>


              <button
                type="button"
                className={
                  secaoAtiva === 'metodologia'
                    ? 'sidebar-item active'
                    : 'sidebar-item'
                }
                onClick={() =>
                  setSecaoAtiva('metodologia')
                }
              >
                <FaFileAlt />

                <span>
                  Metodologia
                </span>
              </button>


              <button
                type="button"
                className={
                  secaoAtiva === 'fonte'
                    ? 'sidebar-item active'
                    : 'sidebar-item'
                }
                onClick={() =>
                  setSecaoAtiva('fonte')
                }
              >
                <FaDatabase />

                <span>
                  Fonte
                </span>
              </button>


              <button
                type="button"
                className={
                  secaoAtiva === 'atualizacoes'
                    ? 'sidebar-item active'
                    : 'sidebar-item'
                }
                onClick={() =>
                  setSecaoAtiva('atualizacoes')
                }
              >
                <FaClock />

                <span>
                  Atualizações
                </span>
              </button>

            </div>

          </aside>


          {/* =========================
              ÁREA CENTRAL
          ========================= */}

          <section className="detalhes-content">

            {secaoAtiva === 'analise' ? (

              paginaPib ? (

                /*
                 * Aqui fica o novo dashboard
                 * feito diretamente com React.
                 */
                <AnalisePib />

              ) : (

                /*
                 * Mantemos o Power BI
                 * temporariamente nas outras
                 * análises.
                 */
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
                      title="Relatório Power BI"
                      src={powerBiUrl}
                      allowFullScreen
                    />

                  </div>

                </div>

              )

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


            {/* =========================
                DOWNLOADS
            ========================= */}

            {paginaPib && (
              <section className="downloads-card">

                <h2>
                  Download dos dados
                </h2>


                <div className="downloads-list">

                  <a
                    href="/datasets/rendimento.csv"
                    download
                    className="download-button"
                  >
                    <FaDownload />

                    Rendimento (.CSV)
                  </a>


                  <a
                    href="/datasets/finbra.csv"
                    download
                    className="download-button"
                  >
                    <FaDownload />

                    Finanças Públicas (.CSV)
                  </a>


                  <a
                    href="/datasets/agro_lavouras.csv"
                    download
                    className="download-button"
                  >
                    <FaDownload />

                    Agropecuária (.CSV)
                  </a>

                </div>

              </section>
            )}

          </section>

        </div>

      </section>

    </main>
  )
}

export default AnaliseDetalhes