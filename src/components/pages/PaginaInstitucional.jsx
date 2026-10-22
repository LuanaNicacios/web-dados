import React from 'react'
import { Link } from 'react-router-dom'
import { FaArrowLeft, FaExternalLinkAlt, FaLock, FaGlobeAmericas } from 'react-icons/fa'
import { aplicacaoInstitucional } from '../../config/integracoes'
import './PaginaInstitucional.css'

/**
 * Rota ja registrada no App.jsx da Etapa 1: /Dados/Institucional.
 * Nao usa token Supabase do portal dentro do iframe e nao tenta
 * contornar requisitos de VPN nem cabecalhos de seguranca da aplicacao.
 */
export default function PaginaInstitucional() {
  const { titulo, descricao, url, ativa, modo } = aplicacaoInstitucional

  // Evita o caso arriscado de sandbox com scripts + same-origin
  // para uma pagina que compartilha a origem do proprio portal.
  const podeIncorporar = ativa && modo === 'iframe' &&
    typeof window !== 'undefined' &&
    new URL(url).origin !== window.location.origin

  return (
    <main className="integracao-institucional">
      <Link to="/Dados" className="integracao-institucional__voltar">
        <FaArrowLeft aria-hidden="true" /> Voltar para Dados
      </Link>

      <header className="integracao-institucional__cabecalho">
        <span className="integracao-institucional__etiqueta">Portal SEPLAG · Aplicações integradas</span>
        <h1>{titulo}</h1>
        <p>{descricao}</p>
      </header>

      {!ativa ? (
        <section className="integracao-institucional__aviso" role="status">
          <FaLock aria-hidden="true" />
          <div>
            <h2>Integração preparada</h2>
            <p>Esta aplicação será ativada quando sua URL HTTPS, as permissões de acesso e o ambiente institucional estiverem disponíveis.</p>
          </div>
        </section>
      ) : (
        <>
          <div className="integracao-institucional__acoes">
            <span><FaGlobeAmericas aria-hidden="true" /> Acesso sujeito às permissões da aplicação de destino e à VPN institucional.</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="integracao-institucional__abrir">
              Abrir aplicação <FaExternalLinkAlt aria-hidden="true" />
            </a>
          </div>
          {podeIncorporar ? (
            <div className="integracao-institucional__moldura">
              <iframe
                title={titulo}
                src={url}
                className="integracao-institucional__iframe"
                loading="lazy"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-downloads"
              />
              <p className="integracao-institucional__nota">
                Se o conteúdo não aparecer, utilize “Abrir aplicação”. A hospedagem de destino precisa permitir iframe (CSP frame-ancestors / X-Frame-Options). Login e cookies internos podem impedir o carregamento incorporado.
              </p>
            </div>
          ) : (
            <section className="integracao-institucional__aviso" role="status">
              <FaExternalLinkAlt aria-hidden="true" />
              <div>
                <h2>A aplicação está pronta para ser aberta</h2>
                <p>Por segurança e compatibilidade com a autenticação institucional, ela será aberta em uma nova aba. O usuário deve ter acesso à rede e autorização no sistema de destino.</p>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}
