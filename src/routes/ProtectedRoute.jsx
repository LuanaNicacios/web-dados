import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { autenticado, carregando } = useAuth()
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

  return children
}