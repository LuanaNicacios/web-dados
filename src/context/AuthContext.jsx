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
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const carregarPerfil = async (usuarioAtual) => {
    if (!usuarioAtual) {
      setPerfil(null)
      return null
    }

    const { data, error } = await supabase
      .from('perfis')
      .select(`
        id,
        nome,
        email,
        perfil,
        ativo
      `)
      .eq('id', usuarioAtual.id)
      .maybeSingle()

    if (error) {
      console.error(
        'Erro ao carregar perfil do usuário:',
        error
      )

      setPerfil(null)

      return null
    }

    setPerfil(data)

    return data
  }

  useEffect(() => {
    const carregarSessao = async () => {
      try {
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

        const usuarioAtual =
          session?.user ?? null

        setUsuario(usuarioAtual)

        if (usuarioAtual) {
          await carregarPerfil(usuarioAtual)
        } else {
          setPerfil(null)
        }
      } catch (error) {
        console.error(
          'Erro ao carregar autenticação:',
          error
        )

        setUsuario(null)
        setPerfil(null)
      } finally {
        setCarregando(false)
      }
    }

    carregarSessao()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const usuarioAtual =
          session?.user ?? null

        setUsuario(usuarioAtual)

        if (usuarioAtual) {
          await carregarPerfil(usuarioAtual)
        } else {
          setPerfil(null)
        }

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

    const usuarioAtual =
      data?.user ?? null

    if (usuarioAtual) {
      setUsuario(usuarioAtual)

      await carregarPerfil(usuarioAtual)
    }

    return data
  }

  const sair = async () => {
    const { error } =
      await supabase.auth.signOut({
        scope: 'local'
      })

    if (error) {
      throw error
    }

    setUsuario(null)
    setPerfil(null)
  }

  const isAdmin =
    perfil?.perfil === 'admin'

  const isAnalista =
    perfil?.perfil === 'analista'

  const isVisitante =
    perfil?.perfil === 'visitante'

  const value = {
    usuario,
    perfil,

    carregando,

    autenticado: Boolean(usuario),

    isAdmin,
    isAnalista,
    isVisitante,

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