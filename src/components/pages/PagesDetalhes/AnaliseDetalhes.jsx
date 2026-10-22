
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
  FaClock
} from 'react-icons/fa'

import AnalisePib from './pib/AnalisePib'

// Informações das seções laterais
const secoes = {
  sobre: {
    titulo: 'Sobre os dados',
    conteudo:
      'O portal apresenta indicadores econômicos organizados por setores, como Agropecuária, Comércio Varejista, Serviços e Mercado de Trabalho. Os dados são consultados diretamente no banco de dados da SEPLAG e apresentados por meio de gráficos, tabelas e filtros interativos.'
  },

  metodologia: {
    titulo: 'Metodologia',
    conteudo:
      'As informações são consultadas no PostgreSQL através de uma API desenvolvida em Node.js e apresentadas no portal utilizando React. Os gráficos permitem visualizar a evolução dos indicadores e comparar diferentes períodos. As unidades de medida e as definições metodológicas ainda serão verificadas com a equipe de dados.'
  },

  fonte: {
    titulo: 'Fonte',
    conteudo:
      'Os dados utilizados nesta etapa estão armazenados no banco PostgreSQL da SEPLAG, dentro do schema pib. As análises utilizam informações de lavouras, comércio varejista, serviços e movimentações do emprego formal.'
  },

  atualizacoes: {
    titulo: 'Atualizações',
    conteudo:
      'Os dashboards consultam os registros disponíveis no banco através da API. Novas informações podem ser visualizadas conforme os dados forem atualizados pela equipe responsável. Atualmente, a aplicação está em ambiente local de desenvolvimento, com acesso ao banco pela VPN.'
  }
}

// Configuração do menu lateral
const menu = [
  {
    id: 'analise',
    titulo: 'Análise dos dados',
    icone: FaChartBar
  },
  {
    id: 'sobre',
    titulo: 'Sobre os dados',
    icone: FaInfoCircle
  },
  {
    id: 'metodologia',
    titulo: 'Metodologia',
    icone: FaFileAlt
  },
  {
    id: 'fonte',
    titulo: 'Fonte',
    icone: FaDatabase
  },
  {
    id: 'atualizacoes',
    titulo: 'Atualizações',
    icone: FaClock
  }
]

const AnaliseDetalhes = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [secaoAtiva, setSecaoAtiva] = useState('analise')

  const paginaPib = location.pathname
    .toLowerCase()
    .includes('/analises/pib')

  const handleVoltar = () => {
    navigate('/Analises')
  }

  const secaoSelecionada = secoes[secaoAtiva]

  return (
    <main className="detalhes-page">
      <section className="detalhes-container">

        {/* NAVEGAÇÃO */}

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

        {/* CABEÇALHO */}

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
                  ? 'Indicadores econômicos apresentados diretamente no portal, com gráficos e filtros interativos.'
                  : 'Área de visualização e análise dos dados disponíveis.'}
              </p>

              {paginaPib && (
                <div className="detalhes-tags">
                  <span>PIB</span>
                  <span>Indicadores Econômicos</span>
                  <span>PostgreSQL</span>
                </div>
              )}

            </div>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL */}

        <div className="detalhes-layout">

          {/* MENU LATERAL */}

          <aside className="detalhes-sidebar">

            <div className="sidebar-description">

              <h2>Sobre os dados</h2>

              <p>
                {paginaPib
                  ? 'Indicadores econômicos organizados por setor, permitindo visualizar a evolução dos dados e comparar os períodos disponíveis.'
                  : 'Informações relacionadas à análise selecionada.'}
              </p>

            </div>

            <div className="sidebar-menu">

              {menu.map((item) => {
                const Icone = item.icone

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      secaoAtiva === item.id
                        ? 'sidebar-item active'
                        : 'sidebar-item'
                    }
                    onClick={() => setSecaoAtiva(item.id)}
                  >
                    <Icone />
                    <span>{item.titulo}</span>
                  </button>
                )
              })}

            </div>
          </aside>

          {/* ÁREA CENTRAL */}

          <section className="detalhes-content">

            {secaoAtiva === 'analise' ? (

              paginaPib ? (

                <AnalisePib />

              ) : (

                <div className="information-card">
                  <h2>Análise em desenvolvimento</h2>

                  <p>
                    Esta análise ainda não foi integrada
                    aos dashboards do portal.
                  </p>
                </div>

              )

            ) : (

              <div className="information-card">

                <h2>
                  {secaoSelecionada.titulo}
                </h2>

                <p>
                  {paginaPib
                    ? secaoSelecionada.conteudo
                    : 'As informações desta análise serão disponibilizadas conforme o desenvolvimento do portal.'}
                </p>

              </div>

            )}

          </section>

        </div>

      </section>
    </main>
  )
}

export default AnaliseDetalhes
