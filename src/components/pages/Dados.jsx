import React, { useRef, useState } from 'react'
import './Dados.css'

import {
  FaUpload,
  FaFileCsv,
  FaFileExcel,
  FaFileCode,
  FaGlobeAmericas,
  FaFilm,
  FaDownload,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimes
} from 'react-icons/fa'

import { uploadArquivo } from '../../services/uploadService'

const EXTENSOES_PERMITIDAS = [
  'csv',
  'xlsx',
  'xls',
  'json'
]

// 10 MB em bytes
const TAMANHO_MAXIMO = 10 * 1024 * 1024

export default function Dados() {
  const [arquivoSelecionado, setArquivoSelecionado] =
    useState(null)

  const [arrastando, setArrastando] =
    useState(false)

  const [importando, setImportando] =
    useState(false)

  const [arquivosEnviados, setArquivosEnviados] =
    useState([])

  const [mensagem, setMensagem] = useState({
    tipo: '',
    texto: ''
  })

  const inputArquivoRef = useRef(null)

  const formatarTamanhoArquivo = (tamanhoEmBytes) => {
    if (tamanhoEmBytes < 1024) {
      return `${tamanhoEmBytes} bytes`
    }

    if (tamanhoEmBytes < 1024 * 1024) {
      return `${(tamanhoEmBytes / 1024).toFixed(1)} KB`
    }

    return `${(
      tamanhoEmBytes /
      (1024 * 1024)
    ).toFixed(2)} MB`
  }

  const obterExtensao = (nomeArquivo = '') => {
    const partesDoNome = nomeArquivo.split('.')

    if (partesDoNome.length < 2) {
      return ''
    }

    return partesDoNome
      .pop()
      .toLowerCase()
  }

  const validarArquivo = (arquivo) => {
    if (!arquivo) {
      return {
        valido: false,
        erro: 'Nenhum arquivo foi selecionado.'
      }
    }

    const extensao = obterExtensao(arquivo.name)

    if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
      return {
        valido: false,
        erro:
          'Formato inválido. Selecione um arquivo CSV, XLSX, XLS ou JSON.'
      }
    }

    if (arquivo.size === 0) {
      return {
        valido: false,
        erro: 'O arquivo selecionado está vazio.'
      }
    }

    if (arquivo.size > TAMANHO_MAXIMO) {
      return {
        valido: false,
        erro:
          'O arquivo ultrapassa o limite máximo de 10 MB.'
      }
    }

    return {
      valido: true,
      erro: ''
    }
  }

  const limparInputArquivo = () => {
    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = ''
    }
  }

  const selecionarArquivo = (arquivo) => {
    setMensagem({
      tipo: '',
      texto: ''
    })

    const resultadoValidacao =
      validarArquivo(arquivo)

    if (!resultadoValidacao.valido) {
      setArquivoSelecionado(null)

      setMensagem({
        tipo: 'erro',
        texto: resultadoValidacao.erro
      })

      limparInputArquivo()

      return
    }

    setArquivoSelecionado(arquivo)

    setMensagem({
      tipo: 'sucesso',
      texto:
        'Arquivo validado e pronto para importação.'
    })
  }

  const handleFileChange = (event) => {
    const arquivo =
      event.target.files?.[0]

    selecionarArquivo(arquivo)
  }

  const handleDragEnter = (event) => {
    event.preventDefault()

    if (!importando) {
      setArrastando(true)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()

    if (!importando) {
      setArrastando(true)
    }
  }

  const handleDragLeave = (event) => {
    event.preventDefault()

    setArrastando(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()

    setArrastando(false)

    if (importando) {
      return
    }

    const arquivo =
      event.dataTransfer.files?.[0]

    selecionarArquivo(arquivo)
  }

  const abrirSeletorDeArquivos = () => {
    if (importando) {
      return
    }

    inputArquivoRef.current?.click()
  }

  const removerArquivoSelecionado = () => {
    if (importando) {
      return
    }

    setArquivoSelecionado(null)

    setMensagem({
      tipo: '',
      texto: ''
    })

    limparInputArquivo()
  }

  const importarArquivo = async () => {
    if (!arquivoSelecionado || importando) {
      return
    }

    const resultadoValidacao =
      validarArquivo(arquivoSelecionado)

    if (!resultadoValidacao.valido) {
      setMensagem({
        tipo: 'erro',
        texto: resultadoValidacao.erro
      })

      return
    }

    try {
      setImportando(true)

      setMensagem({
        tipo: 'carregando',
        texto:
          'Enviando arquivo para o Supabase...'
      })

      const caminhoStorage =
        await uploadArquivo(arquivoSelecionado)

      const arquivoEnviado = {
        id: `${Date.now()}-${arquivoSelecionado.name}`,
        nome: arquivoSelecionado.name,
        tamanho: arquivoSelecionado.size,
        extensao: obterExtensao(
          arquivoSelecionado.name
        ),
        caminhoStorage
      }

      setArquivosEnviados(
        (arquivosAtuais) => [
          arquivoEnviado,
          ...arquivosAtuais
        ]
      )

      setMensagem({
        tipo: 'sucesso',
        texto:
          'Arquivo importado e armazenado no Supabase com sucesso!'
      })

      setArquivoSelecionado(null)

      limparInputArquivo()
    } catch (erro) {
      console.error(
        'Erro ao importar o arquivo:',
        erro
      )

      let mensagemErro =
        'Não foi possível importar o arquivo. Tente novamente.'

      if (
        erro?.message?.toLowerCase().includes(
          'row-level security'
        )
      ) {
        mensagemErro =
          'O Supabase bloqueou o envio por falta de permissão. Verifique as políticas RLS.'
      } else if (
        erro?.message?.toLowerCase().includes(
          'duplicate'
        )
      ) {
        mensagemErro =
          'Já existe um arquivo com esse caminho no banco.'
      } else if (
        erro?.message
      ) {
        mensagemErro =
          `Erro no envio: ${erro.message}`
      }

      setMensagem({
        tipo: 'erro',
        texto: mensagemErro
      })
    } finally {
      setImportando(false)
    }
  }

  const obterIconeDoArquivo = (extensao) => {
    if (extensao === 'csv') {
      return <FaFileCsv />
    }

    if (
      extensao === 'xlsx' ||
      extensao === 'xls'
    ) {
      return <FaFileExcel />
    }

    return <FaFileCode />
  }

  return (
    <main className="dados-page">
      <section className="dados-container">

        <header className="dados-header">
          <h1 className="dados-titulo">
            Gestão de Dados
          </h1>

          <p className="dados-subtitulo">
            Envie seus arquivos ou baixe conjuntos
            de dados disponíveis.
          </p>
        </header>

        <div className="dados-grid">

          <section className="dados-card">

            <div className="card-cabecalho">

              <div className="card-icone">
                <FaUpload />
              </div>

              <div>
                <h2>Enviar arquivo</h2>

                <p>
                  Selecione ou arraste um arquivo
                  para importar os dados.
                </p>
              </div>

            </div>

            <div
              className={
                arrastando
                  ? 'upload-zona arrastando'
                  : 'upload-zona'
              }
              role="button"
              tabIndex={0}
              aria-label="Selecionar arquivo para importação"
              aria-disabled={importando}
              onClick={abrirSeletorDeArquivos}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' ||
                  event.key === ' '
                ) {
                  event.preventDefault()
                  abrirSeletorDeArquivos()
                }
              }}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >

              <input
                ref={inputArquivoRef}
                type="file"
                hidden
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileChange}
                disabled={importando}
              />

              <div className="upload-icone">
                <FaUpload />
              </div>

              <p className="upload-principal">
                Clique para selecionar
              </p>

              <p className="upload-secundario">
                ou arraste o arquivo até esta área
              </p>

              <span className="upload-formatos">
                CSV, XLSX, XLS ou JSON — máximo 10 MB
              </span>

            </div>

            {arquivoSelecionado && (
              <div className="arquivo-selecionado">

                <div className="arquivo-selecionado-informacoes">

                  <strong>
                    Arquivo selecionado
                  </strong>

                  <span
                    title={arquivoSelecionado.name}
                  >
                    {arquivoSelecionado.name}
                  </span>

                  <small>
                    {obterExtensao(
                      arquivoSelecionado.name
                    ).toUpperCase()}

                    {' • '}

                    {formatarTamanhoArquivo(
                      arquivoSelecionado.size
                    )}
                  </small>

                </div>

                <button
                  type="button"
                  onClick={removerArquivoSelecionado}
                  disabled={importando}
                  aria-label="Remover arquivo selecionado"
                >
                  <FaTimes />
                  Remover
                </button>

              </div>
            )}

            {mensagem.texto && (
              <div
                className={
                  `mensagem-upload mensagem-${mensagem.tipo}`
                }
                role={
                  mensagem.tipo === 'erro'
                    ? 'alert'
                    : 'status'
                }
              >

                {mensagem.tipo === 'erro' && (
                  <FaExclamationCircle />
                )}

                {mensagem.tipo === 'sucesso' && (
                  <FaCheckCircle />
                )}

                {mensagem.tipo === 'carregando' && (
                  <span className="upload-spinner" />
                )}

                <span>{mensagem.texto}</span>

              </div>
            )}

            <button
              type="button"
              className="enviar-button"
              disabled={
                !arquivoSelecionado ||
                importando
              }
              onClick={importarArquivo}
            >

              {importando ? (
                <>
                  <span className="button-spinner" />
                  Importando...
                </>
              ) : (
                <>
                  <FaUpload />
                  Importar dados
                </>
              )}

            </button>

          </section>

          <section className="dados-card">

            <div className="card-cabecalho">

              <div className="card-icone">
                <FaDownload />
              </div>

              <div>
                <h2>Baixar dados</h2>

                <p>
                  Datasets disponíveis para download.
                </p>
              </div>

            </div>

            <div className="lista-downloads">

              {arquivosEnviados.map((arquivo) => (
                <div
                  key={arquivo.id}
                  className="arquivo-item arquivo-item-importado"
                >

                  <span className="arquivo-item-icone">
                    {obterIconeDoArquivo(
                      arquivo.extensao
                    )}
                  </span>

                  <span className="arquivo-item-texto">

                    <strong>
                      {arquivo.nome}
                    </strong>

                    <small>
                      Enviado ao Supabase •{' '}
                      {formatarTamanhoArquivo(
                        arquivo.tamanho
                      )}
                    </small>

                  </span>

                  <FaCheckCircle
                    className="download-icon"
                    title="Upload concluído"
                  />

                </div>
              ))}

              <a
                href="/datasets/imdb.csv"
                download
                className="arquivo-item"
              >
                <span className="arquivo-item-icone">
                  <FaFilm />
                </span>

                <span className="arquivo-item-texto">
                  <strong>IMDB Movies</strong>
                  <small>Arquivo CSV</small>
                </span>

                <FaDownload className="download-icon" />
              </a>

              <a
                href="/datasets/vendas.xlsx"
                download
                className="arquivo-item"
              >
                <span className="arquivo-item-icone">
                  <FaFileExcel />
                </span>

                <span className="arquivo-item-texto">
                  <strong>Vendas Online</strong>
                  <small>Arquivo XLSX</small>
                </span>

                <FaDownload className="download-icon" />
              </a>

              <a
                href="/datasets/orcamento.csv"
                download
                className="arquivo-item"
              >
                <span className="arquivo-item-icone">
                  <FaFileCsv />
                </span>

                <span className="arquivo-item-texto">
                  <strong>
                    Orçamento Público
                  </strong>

                  <small>Arquivo CSV</small>
                </span>

                <FaDownload className="download-icon" />
              </a>

              <a
                href="/datasets/populacao.csv"
                download
                className="arquivo-item"
              >
                <span className="arquivo-item-icone">
                  <FaGlobeAmericas />
                </span>

                <span className="arquivo-item-texto">
                  <strong>
                    Dados de População
                  </strong>

                  <small>Arquivo CSV</small>
                </span>

                <FaDownload className="download-icon" />
              </a>

            </div>

          </section>

        </div>

      </section>
    </main>
  )
}