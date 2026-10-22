import React, { useState } from 'react'

import './AnalisePib.css'
import './AnalisePibNovasAbas.css'

import DashboardAgropecuaria from './DashboardAgropecuaria'
import DashboardComercio from './DashboardComercio'
import DashboardServicos from './DashboardServicos'
import DashboardMercadoTrabalho from './DashboardMercadoTrabalho'
import DashboardOcupacaoRendimento from './DashboardOcupacaoRendimento'
import DashboardIpca from './DashboardIpca'
import DashboardMercadoTrabalhoCnae from './DashboardMercadoTrabalhoCnae'
import DashboardSaude from './DashboardSaude'
import DashboardSeguros from './DashboardSeguros'




const ABAS = [
  
  {id: 'agropecuaria', titulo: 'Agropecuária', componente: DashboardAgropecuaria},
  { id: 'comercio', titulo: 'Comércio Varejista', componente: DashboardComercio },
  { id: 'servicos', titulo: 'Serviços', componente: DashboardServicos },
  { id: 'trabalho', titulo: 'Mercado de Trabalho', componente: DashboardMercadoTrabalhoCnae },
  { id: 'ocupacao', titulo: 'Ocupação e Rendimento', componente: DashboardOcupacaoRendimento },
  { id: 'ipca', titulo: 'Inflação — IPCA', componente: DashboardIpca },
  { id: 'saude', titulo: 'Saúde — DATASUS', componente: DashboardSaude },
  { id: 'seguros', titulo: 'Mercado de Seguros', componente: DashboardSeguros }

]

function AnalisePib() {
  const [abaAtiva, setAbaAtiva] = useState('agropecuaria')
  const aba = ABAS.find((item) => item.id === abaAtiva) || ABAS[0]
  const ComponenteAtivo = aba.componente

  return (
    <div className="analise-pib pib-seis-abas">
      <header className="pib-header">
        <h2>Painel de Indicadores Econômicos</h2>
        <p>Visualização interativa dos dados disponíveis no banco de dados da SEPLAG.</p>
      </header>
      <nav className="pib-abas pib-seis-navegacao" aria-label="Áreas de análise econômica">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`pib-aba ${abaAtiva === item.id ? 'ativa' : ''}`}
            aria-current={abaAtiva === item.id ? 'page' : undefined}
            onClick={() => setAbaAtiva(item.id)}
          >
            {item.titulo}
          </button>
        ))}
      </nav>
      <section className="pib-conteudo-aba" aria-label={aba.titulo}>
        <ComponenteAtivo />
      </section>
    </div>
  )
}

export default AnalisePib
