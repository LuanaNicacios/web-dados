import React, { useState } from 'react'

import {
  NavLink,
  useNavigate
} from 'react-router-dom'

import {
  FaSignOutAlt
} from 'react-icons/fa'

import { useAuth } from '../../context/AuthContext'

import logonavbars1 from '../../assets/logonavbars1.png'

import './Navbar.css'

const Navbar = () => {
  const [saindo, setSaindo] = useState(false)

  const { sair } = useAuth()

  const navigate = useNavigate()

  const handleSair = async () => {
    if (saindo) {
      return
    }

    try {
      setSaindo(true)

      await sair()

      navigate('/login', {
        replace: true
      })
    } catch (erro) {
      console.error(
        'Erro ao encerrar a sessão:',
        erro
      )

      window.alert(
        'Não foi possível encerrar a sessão. Tente novamente.'
      )
    } finally {
      setSaindo(false)
    }
  }

  return (
    <header className="navbar-container">

      <nav
        className="navbar"
        aria-label="Navegação principal"
      >

        <NavLink
          to="/"
          className="logo-link"
          aria-label="Ir para a página inicial"
        >
          <img
            src={logonavbars1}
            alt="Logo do site DataSets"
            className="logonavbar"
          />
        </NavLink>

        <div className="navbar-conteudo">

          <ul className="navbar-menu">

            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive
                    ? 'nav-link active'
                    : 'nav-link'
                }
              >
                Home
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/Analises"
                className={({ isActive }) =>
                  isActive
                    ? 'nav-link active'
                    : 'nav-link'
                }
              >
                Análises
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/Dados"
                className={({ isActive }) =>
                  isActive
                    ? 'nav-link active'
                    : 'nav-link'
                }
              >
                Dados
              </NavLink>
            </li>

          </ul>

          <button
            type="button"
            className="logout-button"
            onClick={handleSair}
            disabled={saindo}
            aria-label="Sair do portal"
          >
            <FaSignOutAlt />

            <span>
              {saindo ? 'Saindo...' : 'Sair'}
            </span>
          </button>

        </div>

      </nav>

    </header>
  )
}

export default Navbar

