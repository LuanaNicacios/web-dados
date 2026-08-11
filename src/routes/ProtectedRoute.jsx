import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({
  children,
  perfisPermitidos = []
}) {
  const {
    autenticado,
    carregando,
    perfil
  } = useAuth()

  const location = useLocation()

  if (carregando) {
    return (
      <main className="auth-loading">
        <p>Verificando acesso...</p>
      </main>
    )
  }

  if (!autenticado) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname
        }}
      />
    )
  }

  /*
   * Se nenhuma permissão foi informada,
   * qualquer usuário autenticado pode entrar.
   */
  if (perfisPermitidos.length === 0) {
    return children
  }

  /*
   * Caso exista uma lista de perfis,
   * verificamos se o perfil atual está nela.
   */
  const usuarioTemPermissao =
    perfisPermitidos.includes(perfil?.perfil)

  if (!usuarioTemPermissao) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return children
}