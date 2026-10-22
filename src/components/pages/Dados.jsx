import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FaChartBar, FaChartLine, FaFolderOpen, FaLock, FaUpload } from 'react-icons/fa'
import './CatalogoDados.css'
import { aplicacaoInstitucional } from '../../config/integracoes'

export default function Dados() {
  const { isAdmin } = useAuth()

  return (
    <main className="catalogo-dados">
      <div className="catalogo-dados__cabecalho">
        <span className="catalogo-dados__etiqueta">Portal de análises — SEPLAG</span>
        <h1>Dados</h1>
        <p>Explore os painéis e relatórios disponíveis no portal.</p>
      </div>

      <div className="catalogo-dados__grade">
        {isAdmin ? (
          <Link className="catalogo-dados__card" to="/Analises/PIB">
            <span className="catalogo-dados__icone"><FaChartBar aria-hidden="true" /></span>
            <h2>Dados PIB</h2>
            <p>Indicadores econômicos integrados ao PostgreSQL, com filtros e análises.</p>
            <span className="catalogo-dados__acao">Abrir painel →</span>
          </Link>
        ) : (
          <div className="catalogo-dados__card catalogo-dados__card--restrito">
            <span className="catalogo-dados__icone"><FaLock aria-hidden="true" /></span>
            <h2>Dados PIB</h2>
            <p>Disponível apenas para o perfil administrador, conforme as permissões atuais.</p>
            <span className="catalogo-dados__acao">Acesso restrito</span>
          </div>
        )}

        <Link className="catalogo-dados__card" to="/Dados/Previsao-Receitas">
          <span className="catalogo-dados__icone"><FaChartLine aria-hidden="true" /></span>
          <h2>Previsão de Receitas Municipais</h2>
          <p>Relatório de previsões, modelos e qualidade dos dados dos municípios.</p>
          <span className="catalogo-dados__acao">Abrir relatório →</span>
        </Link>
        {aplicacaoInstitucional.ativa && (
          <Link className="catalogo-dados__card" to="/Dados/Institucional">
            <span className="catalogo-dados__icone"><FaFolderOpen aria-hidden="true" /></span>
            <h2>{aplicacaoInstitucional.titulo}</h2>
            <p>{aplicacaoInstitucional.descricao}</p>
            <span className="catalogo-dados__acao">Abrir aplicação →</span>
          </Link>
        )}
      </div>

      {isAdmin && (
        <div className="catalogo-dados__administracao">
          <FaFolderOpen aria-hidden="true" />
          <span>Administração de arquivos</span>
          <Link to="/Dados/Arquivos"><FaUpload aria-hidden="true" /> Gerenciar arquivos</Link>
        </div>
      )}
    </main>
  )
}
