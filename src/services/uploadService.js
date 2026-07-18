import { supabase } from './supabase'

export async function uploadArquivo(arquivo) {
  if (!arquivo) {
    throw new Error(
      'Nenhum arquivo foi informado.'
    )
  }

  const extensao = arquivo.name
    .split('.')
    .pop()
    .toLowerCase()

  const nomeSemExtensao = arquivo.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')

  const nomeArquivo =
    `${Date.now()}-${nomeSemExtensao}.${extensao}`

  const caminhoArquivo =
    `uploads/${nomeArquivo}`

  const { error: erroUpload } =
    await supabase.storage
      .from('datasets')
      .upload(
        caminhoArquivo,
        arquivo,
        {
          cacheControl: '3600',
          upsert: false,
          contentType:
            arquivo.type || undefined
        }
      )

  if (erroUpload) {
    throw erroUpload
  }

  const { error: erroBanco } =
    await supabase
      .from('arquivos')
      .insert({
        nome_original: arquivo.name,
        nome_armazenado: nomeArquivo,
        caminho_storage: caminhoArquivo,
        extensao,
        tipo_mime:
          arquivo.type ||
          'application/octet-stream',
        tamanho_bytes: arquivo.size
      })

  if (erroBanco) {
    /*
     * Se o arquivo chegou ao Storage, mas o registro
     * falhou no banco, removemos o arquivo para evitar
     * que ele fique perdido no bucket.
     */
    await supabase.storage
      .from('datasets')
      .remove([caminhoArquivo])

    throw erroBanco
  }

  return caminhoArquivo
}