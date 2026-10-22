import { supabase } from './supabase'

/**
 * Use somente para as APIs institucionais que exigem usuário Supabase.
 * Preserva as opções originais de fetch (signal, cache, headers etc.).
 */
export async function fetchApiProtegida(url, opcoes = {}) {
  const { data, error } = await supabase.auth.getSession()
  const token = data?.session?.access_token

  if (error || !token) {
    throw new Error('Sua sessão expirou. Entre novamente no portal.')
  }

  const headers = new Headers(opcoes.headers || {})
  headers.set('Authorization', `Bearer ${token}`)

  return fetch(url, { ...opcoes, headers, cache: 'no-store' })
}
