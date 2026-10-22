/**
 * Configuracao PUBLICA do frontend (Vite).
 * Nao colocar tokens, senhas, chaves secretas ou credenciais aqui.
 * As variaveis VITE_* tornam-se visiveis no JavaScript distribuido.
 */
const enderecoInstitucional = (import.meta.env.VITE_INSTITUCIONAL_URL || '').trim()
const modoInstitucional = import.meta.env.VITE_INSTITUCIONAL_MODO === 'iframe'
  ? 'iframe'
  : 'link'

function validarEndereco(url) {
  try {
    const destino = new URL(url)
    return destino.protocol === 'https:'
      ? destino.toString()
      : ''
  } catch {
    return ''
  }
}

const enderecoValidado = validarEndereco(enderecoInstitucional)

export const aplicacaoInstitucional = Object.freeze({
  titulo: (import.meta.env.VITE_INSTITUCIONAL_TITULO || 'Análise Institucional').trim(),
  descricao: 'Aplicação institucional disponível no ambiente interno.',
  url: enderecoValidado,
  ativa: import.meta.env.VITE_INSTITUCIONAL_ATIVA === 'true' && Boolean(enderecoValidado),
  modo: modoInstitucional
})
