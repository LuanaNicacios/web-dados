import Papa from 'papaparse'

export const carregarCsv = async (caminho) => {
  return new Promise((resolve, reject) => {
    Papa.parse(caminho, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,

      complete: (resultado) => {
        resolve(resultado.data)
      },

      error: (erro) => {
        reject(erro)
      }
    })
  })
}