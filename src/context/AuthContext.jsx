import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react'

import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const carregarSessao = async () => {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession()

      if (error) {
        console.error(
          'Erro ao verificar a sessão:',
          error
        )
      }

      setUsuario(session?.user ?? null)
      setCarregando(false)
    }

    carregarSessao()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUsuario(session?.user ?? null)
        setCarregando(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const entrar = async (email, senha) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password: senha
      })

    if (error) {
      throw error
    }

    return data
  }

  const sair = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }
  }

  const value = {
    usuario,
    carregando,
    autenticado: Boolean(usuario),
    entrar,
    sair
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth precisa ser usado dentro de AuthProvider.'
    )
  }

  return context
}