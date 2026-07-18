import { useState } from 'react'
import {
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom'

import { FaLock, FaEnvelope } from 'react-icons/fa'

import { useAuth } from '../../context/AuthContext'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const {
    entrar,
    autenticado,
    carregando
  } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  const destino =
    location.state?.from || '/'

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.trim() || !senha) {
      setErro('Preencha o e-mail e a senha.')
      return
    }

    try {
      setEnviando(true)
      setErro('')

      await entrar(email.trim(), senha)

      navigate(destino, {
        replace: true
      })
    } catch (error) {
      console.error('Erro no login:', error)

      setErro(
        'E-mail ou senha incorretos.'
      )
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <main className="login-page">
        <p>Verificando acesso...</p>
      </main>
    )
  }

  if (autenticado) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="login-page">

      <section className="login-card">

        <div className="login-icon">
          <FaLock />
        </div>

        <header className="login-header">
          <h1>Acesso ao portal</h1>

          <p>
            Informe as credenciais fornecidas
            para acessar o sistema.
          </p>
        </header>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <label htmlFor="email">
            E-mail
          </label>

          <div className="login-input-wrapper">
            <FaEnvelope />

            <input
              id="email"
              type="email"
              placeholder="Digite o e-mail de acesso"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="username"
              disabled={enviando}
            />
          </div>

          <label htmlFor="senha">
            Senha
          </label>

          <div className="login-input-wrapper">
            <FaLock />

            <input
              id="senha"
              type="password"
              placeholder="Digite a senha"
              value={senha}
              onChange={(event) =>
                setSenha(event.target.value)
              }
              autoComplete="current-password"
              disabled={enviando}
            />
          </div>

          {erro && (
            <p
              className="login-error"
              role="alert"
            >
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={enviando}
          >
            {enviando
              ? 'Entrando...'
              : 'Entrar'}
          </button>

        </form>

      </section>

    </main>
  )
}