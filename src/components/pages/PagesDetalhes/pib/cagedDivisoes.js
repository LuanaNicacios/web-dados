'use strict'

// Dados internos: esta rota só deve ser utilizada no backend local da SEPLAG.
// Antes de produção, implementar autenticação/autorização NO SERVIDOR.
module.exports = function registrarCagedDivisoes(app, pool) {
  app.get('/api/mercado-trabalho-divisoes', async (_req, res) => {
    try {
      // A tabela validada contém somente a seção I (Alojamento e Alimentação).
      // Não ampliar o recorte sem validar a cobertura de outras seções/divisões.
      const resultado = await pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', periodo), 'YYYY-MM') AS mes,
          cnae_secao AS secao,
          cnae_divisao AS divisao,
          cnae_divisao_nome AS nome,
          SUM(TRIM(admitidos)::bigint) AS admitidos,
          SUM(TRIM(desligados)::bigint) AS desligados
        FROM pib.caged_movimentacoes_divisao
        WHERE periodo IS NOT NULL
          AND cnae_secao = 'I'
        GROUP BY DATE_TRUNC('month', periodo), cnae_secao,
                 cnae_divisao, cnae_divisao_nome
        ORDER BY DATE_TRUNC('month', periodo), cnae_divisao
      `)

      function inteiroNaoNegativo(valor) {
        const numero = Number(valor)
        if (!Number.isSafeInteger(numero) || numero < 0) {
          throw new Error('Valor de contagem inválido ou excede inteiro seguro')
        }
        return numero
      }

      const vistos = new Set()
      const dados = resultado.rows.map((linha) => {
        const chave = `${linha.mes}|${linha.divisao}`
        if (vistos.has(chave)) throw new Error('Duplicidade de mês/divisão na resposta')
        vistos.add(chave)
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(linha.mes) ||
            !/^\d{2}$/.test(linha.divisao || '') ||
            !linha.nome) {
          throw new Error('Identificação temporal ou CNAE inválida')
        }
        const admitidos = inteiroNaoNegativo(linha.admitidos)
        const desligados = inteiroNaoNegativo(linha.desligados)
        return {
          mes: linha.mes,
          secao: linha.secao,
          divisao: linha.divisao,
          nome: linha.nome,
          admitidos,
          desligados,
          saldo: admitidos - desligados
        }
      })

      res.set('Cache-Control', 'no-store')
      return res.json({
        status: 'sucesso',
        frequencia: 'mensal',
        secao: 'I',
        abrangencia: 'Somente CNAE I — Alojamento e alimentação (divisões 55 e 56)',
        observacao: 'Movimentações do CAGED; não representam estoque de empregos. Não somar com a API por seção.',
        total: dados.length,
        total_divisoes: new Set(dados.map((d) => d.divisao)).size,
        total_meses: new Set(dados.map((d) => d.mes)).size,
        dados
      })
    } catch (erro) {
      // Nunca enviar SQL, credenciais ou detalhes internos ao cliente.
      console.error('Falha ao consultar CAGED por divisão:', erro.code || erro.name)
      return res.status(500).json({
        status: 'erro',
        mensagem: 'Não foi possível consultar o CAGED por divisão.'
      })
    }
  })
}
