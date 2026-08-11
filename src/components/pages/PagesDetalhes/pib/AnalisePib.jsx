import React, {
  useEffect,
  useState
} from 'react'

import './AnalisePib.css'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

import {
  carregarCsv
} from '../../../../services/csvService'

const NOMES_CAMPOS_RENDIMENTO = {
  administracao_publica_defesa_seguridade_social_educacao_saude_humana_servicos_sociais:
    'Administração pública',

  agricultura_pecuaria_producao_florestal_pesca_aquicultura:
    'Agricultura e pecuária',

  alojamento_alimentacao:
    'Alojamento e alimentação',

  atividades_mal_definidas:
    'Atividades mal definidas',

  comercio_reparacao_veiculos_automotores_motocicletas:
    'Comércio',

  construcao:
    'Construção',

  industria_transformacao:
    'Indústria de transformação',

  industria_geral:
    'Indústria geral',

  informacao_comunicacao_atividades_financeiras_imobiliarias_profissionais_administrativas:
    'Informação, finanças e atividades profissionais',

  outros_servicos:
    'Outros serviços',

  servicos_domesticos:
    'Serviços domésticos',

  transporte_armazenagem_correio:
    'Transporte e armazenagem'
}

const TRIBUTOS = [
  {
    campo: 'iptu',
    sigla: 'IPTU',
    nome: 'Imposto Predial e Territorial Urbano'
  },

  {
    campo: 'issqn',
    sigla: 'ISSQN',
    nome: 'Imposto Sobre Serviços de Qualquer Natureza'
  },

  {
    campo: 'itbi',
    sigla: 'ITBI',
    nome: 'Imposto sobre Transmissão de Bens Imóveis'
  },

  {
    campo: 'irrf',
    sigla: 'IRRF',
    nome: 'Imposto de Renda Retido na Fonte'
  },

  {
    campo: 'taxas',
    sigla: 'Taxas',
    nome: 'Taxas municipais'
  }
]

const LAVOURAS = [
  {
    campo: 'lavouras_arroz',
    nome: 'Arroz'
  },

  {
    campo: 'lavouras_cana_de_acucar',
    nome: 'Cana-de-açúcar'
  },

  {
    campo: 'lavouras_castanha_de_caju',
    nome: 'Castanha de caju'
  },

  {
    campo: 'lavouras_cebola',
    nome: 'Cebola'
  },

  {
    campo: 'lavouras_coco_da_baia',
    nome: 'Coco-da-baía'
  },

  {
    campo: 'lavouras_laranja',
    nome: 'Laranja'
  },

  {
    campo: 'lavouras_abacaxi',
    nome: 'Abacaxi'
  },

  {
    campo: 'lavouras_mandioca',
    nome: 'Mandioca'
  },

  {
    campo: 'lavouras_tomate',
    nome: 'Tomate'
  },

  {
    campo: 'lavouras_uva',
    nome: 'Uva'
  },

  {
    campo: 'lavouras_banana',
    nome: 'Banana'
  },

  {
    campo: 'lavouras_cafe_total',
    nome: 'Café'
  }
]


const AnalisePib = () => {

  const baseUrl =
    import.meta.env.BASE_URL


  const [
    dadosRendimento,
    setDadosRendimento
  ] = useState([])


  const [
    dadosFinbra,
    setDadosFinbra
  ] = useState(null)


  const [
    dadosAgro,
    setDadosAgro
  ] = useState([])


  const [
    carregando,
    setCarregando
  ] = useState(true)


  const [
    erro,
    setErro
  ] = useState('')

  const formatarMoeda = (valor) => {

    return new Intl.NumberFormat(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
      }
    ).format(valor || 0)

  }


  const formatarNumero = (valor) => {

    return new Intl.NumberFormat(
      'pt-BR',
      {
        maximumFractionDigits: 0
      }
    ).format(valor || 0)

  }


  const formatarValorEixo = (valor) => {

    if (valor >= 1000000) {

      return `${(
        valor / 1000000
      ).toFixed(1)}M`

    }


    if (valor >= 1000) {

      return `${(
        valor / 1000
      ).toFixed(0)}K`

    }


    return valor

  }

  const calcularMedia = (
    dados,
    campo
  ) => {

    if (!dados?.length) {
      return 0
    }


    const valoresValidos =
      dados
        .map((linha) =>
          Number(
            linha[campo]
          )
        )
        .filter((valor) =>
          Number.isFinite(
            valor
          )
        )


    if (
      valoresValidos.length === 0
    ) {
      return 0
    }


    const soma =
      valoresValidos.reduce(
        (total, valor) =>
          total + valor,
        0
      )


    return (
      soma /
      valoresValidos.length
    )

  }

  const tratarRendimento = (
    dados
  ) => {

    const campos =
      Object.keys(
        NOMES_CAMPOS_RENDIMENTO
      )


    const resultado =
      campos.map((campo) => {

        const media =
          calcularMedia(
            dados,
            campo
          )


        return {

          setor:
            NOMES_CAMPOS_RENDIMENTO[
              campo
            ],

          rendimento:
            Number(
              media.toFixed(2)
            )

        }

      })


    resultado.sort(
      (a, b) =>
        b.rendimento -
        a.rendimento
    )


    return resultado

  }

  const tratarFinbra = (
    dados
  ) => {

    const composicaoTributaria =
      TRIBUTOS.map(
        (tributo) => ({

          sigla:
            tributo.sigla,

          nome:
            tributo.nome,

          valor:
            calcularMedia(
              dados,
              tributo.campo
            )

        })
      )


    return {

      receitaOrcamentaria:
        calcularMedia(
          dados,
          'rec_orcamentaria'
        ),

      receitaCorrente:
        calcularMedia(
          dados,
          'rec_correntes'
        ),

      receitaTributaria:
        calcularMedia(
          dados,
          'rec_tributaria'
        ),

      impostos:
        calcularMedia(
          dados,
          'impostos'
        ),

      transferenciasCorrentes:
        calcularMedia(
          dados,
          'transf_correntes'
        ),

      composicaoTributaria

    }

  }

  const tratarAgro = (
    dados
  ) => {

    const resultado =
      LAVOURAS.map(
        (lavoura) => ({

          lavoura:
            lavoura.nome,

          valor:
            Number(
              calcularMedia(
                dados,
                lavoura.campo
              ).toFixed(2)
            )

        })
      )


    const valoresComDados =
      resultado.filter(
        (item) =>
          item.valor > 0
      )


    valoresComDados.sort(
      (a, b) =>
        b.valor -
        a.valor
    )


    return valoresComDados

  }

  useEffect(() => {

    const carregarDados =
      async () => {

        try {

          setCarregando(true)

          setErro('')


          const [
            rendimento,
            finbra,
            agro
          ] =
            await Promise.all([

              carregarCsv(
                `${baseUrl}datasets/rendimento.csv`
              ),

              carregarCsv(
                `${baseUrl}datasets/finbra.csv`
              ),

              carregarCsv(
                `${baseUrl}datasets/agro_lavouras.csv`
              )

            ])


          if (
            !rendimento?.length
          ) {

            throw new Error(
              'O arquivo rendimento.csv não possui dados.'
            )

          }


          if (
            !finbra?.length
          ) {

            throw new Error(
              'O arquivo finbra.csv não possui dados.'
            )

          }


          if (
            !agro?.length
          ) {

            throw new Error(
              'O arquivo agro_lavouras.csv não possui dados.'
            )

          }


          setDadosRendimento(
            tratarRendimento(
              rendimento
            )
          )


          setDadosFinbra(
            tratarFinbra(
              finbra
            )
          )


          setDadosAgro(
            tratarAgro(
              agro
            )
          )


        } catch (error) {

          console.error(
            'Erro ao carregar dados da análise:',
            error
          )


          setErro(
            'Não foi possível carregar os dados da análise.'
          )


        } finally {

          setCarregando(false)

        }

      }


    carregarDados()

  }, [baseUrl])

  if (carregando) {

    return (

      <div className="pib-estado">

        <span
          className="pib-spinner"
        />

        <p>
          Carregando dados econômicos...
        </p>

      </div>

    )

  }

  if (erro) {

    return (

      <div
        className="
          pib-estado
          pib-erro
        "
      >
        {erro}
      </div>

    )

  }

  return (

    <div className="analise-pib">

      <header className="pib-header">

        <h2>
          Análise Econômica
        </h2>

        <p>
        </p>

      </header>

      <section className="pib-section">

        <div className="pib-section-header">

          <h3>
            Rendimento por atividade econômica
          </h3>

          <p>
          </p>

        </div>


        <article className="pib-grafico-card">

          <div className="pib-grafico">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={
                  dadosRendimento
                }
                layout="vertical"
                margin={{
                  top: 5,
                  right: 25,
                  left: 20,
                  bottom: 5
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />


                <XAxis
                  type="number"
                  tickFormatter={
                    (valor) =>
                      `R$ ${valor}`
                  }
                />


                <YAxis
                  type="category"
                  dataKey="setor"
                  width={190}
                  tick={{
                    fontSize: 10
                  }}
                />


                <Tooltip
                  formatter={
                    (valor) => [
                      formatarMoeda(
                        valor
                      ),
                      'Rendimento médio'
                    ]
                  }
                />


                <Bar
                  dataKey="rendimento"
                  fill="#2563eb"
                  radius={[
                    0,
                    6,
                    6,
                    0
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </article>

      </section>

      {dadosFinbra && (

        <section className="pib-section">

          <div className="pib-section-header">

            <h3>
              Finanças Públicas
            </h3>

            <p>
            </p>

          </div>


          <div className="finbra-cards">


            <article className="finbra-card">

              <span>
                Receita Orçamentária
              </span>

              <strong>
                {formatarMoeda(
                  dadosFinbra
                    .receitaOrcamentaria
                )}
              </strong>

            </article>


            <article className="finbra-card">

              <span>
                Receita Corrente
              </span>

              <strong>
                {formatarMoeda(
                  dadosFinbra
                    .receitaCorrente
                )}
              </strong>

            </article>


            <article className="finbra-card">

              <span>
                Receita Tributária
              </span>

              <strong>
                {formatarMoeda(
                  dadosFinbra
                    .receitaTributaria
                )}
              </strong>

            </article>


            <article className="finbra-card">

              <span>
                Impostos
              </span>

              <strong>
                {formatarMoeda(
                  dadosFinbra
                    .impostos
                )}
              </strong>

            </article>


            <article
              className="
                finbra-card
                finbra-card-destaque
              "
            >

              <span>
                Transferências Correntes
              </span>

              <strong>
                {formatarMoeda(
                  dadosFinbra
                    .transferenciasCorrentes
                )}
              </strong>

            </article>

          </div>


          <article className="pib-grafico-card">

            <div className="pib-grafico-header">

              <h3>
                Principais receitas tributárias
              </h3>

              <p>
              </p>

            </div>


            <div className="finbra-grafico">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={
                    dadosFinbra
                      .composicaoTributaria
                  }
                  margin={{
                    top: 5,
                    right: 15,
                    left: 10,
                    bottom: 5
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />


                  <XAxis
                    dataKey="sigla"
                    tick={{
                      fontSize: 11
                    }}
                  />


                  <YAxis
                    tickFormatter={
                      formatarValorEixo
                    }
                    tick={{
                      fontSize: 10
                    }}
                  />


                  <Tooltip
                    formatter={
                      (valor) => [
                        formatarMoeda(
                          valor
                        ),
                        'Valor médio'
                      ]
                    }
                    labelFormatter={
                      (sigla) => {

                        const item =
                          dadosFinbra
                            .composicaoTributaria
                            .find(
                              (dado) =>
                                dado.sigla === sigla
                            )


                        if (!item) {
                          return sigla
                        }


                        return (
                          `${item.sigla} — ${item.nome}`
                        )

                      }
                    }
                  />


                  <Bar
                    dataKey="valor"
                    fill="#2563eb"
                    radius={[
                      6,
                      6,
                      0,
                      0
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>


            <div className="tributos-legenda">

              {dadosFinbra
                .composicaoTributaria
                .map(
                  (tributo) => (

                    <div
                      key={
                        tributo.sigla
                      }
                      className="
                        tributo-legenda-item
                      "
                    >

                      <strong>
                        {tributo.sigla}
                      </strong>

                      <span>
                        {tributo.nome}
                      </span>

                    </div>

                  )
                )}

            </div>

          </article>

        </section>

      )}

      {dadosAgro.length > 0 && (

        <section className="pib-section">

          <div className="pib-section-header">

            <h3>
              Produção Agrícola
            </h3>

            <p>
            </p>

          </div>


          <article className="pib-grafico-card">

            <div className="pib-grafico-header">

              <h3>
                Produção média por lavoura
              </h3>

              <p>
              </p>

            </div>


            <div className="agro-grafico">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={dadosAgro}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 25,
                    left: 15,
                    bottom: 5
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                  />


                  <XAxis
                    type="number"
                    tickFormatter={
                      formatarValorEixo
                    }
                    tick={{
                      fontSize: 10
                    }}
                  />


                  <YAxis
                    type="category"
                    dataKey="lavoura"
                    width={125}
                    tick={{
                      fontSize: 10
                    }}
                  />


                  <Tooltip
                    formatter={
                      (valor) => [
                        formatarNumero(
                          valor
                        ),
                        'Média'
                      ]
                    }
                  />


                  <Bar
                    dataKey="valor"
                    fill="#2563eb"
                    radius={[
                      0,
                      6,
                      6,
                      0
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </article>

        </section>

      )}

    </div>
  )
}

export default AnalisePib