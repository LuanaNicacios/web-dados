import React, { useState } from 'react'
import DashboardMercadoTrabalho from './DashboardMercadoTrabalho'
import DashboardCagedDivisoes from './DashboardCagedDivisoes'
import './DashboardMercadoTrabalhoCnae.css'

// Mantém a visão por seção e adiciona o recorte de divisões da seção I.
export default function DashboardMercadoTrabalhoCnae() {
  const [aba, setAba] = useState('secoes')
  return (
    <div className="caged-abas-layout">
      <nav className="caged-subabas" aria-label="Detalhamento do Mercado de Trabalho">
        <button type="button" className={aba === 'secoes' ? 'caged-subaba ativa' : 'caged-subaba'} onClick={() => setAba('secoes')} aria-current={aba === 'secoes' ? 'page' : undefined}>
          Visão geral — Seções CNAE
        </button>
        <button type="button" className={aba === 'divisoes' ? 'caged-subaba ativa' : 'caged-subaba'} onClick={() => setAba('divisoes')} aria-current={aba === 'divisoes' ? 'page' : undefined}>
          Detalhamento — Alojamento e Alimentação
        </button>
      </nav>
      {aba === 'secoes' ? <DashboardMercadoTrabalho /> : <DashboardCagedDivisoes />}
    </div>
  )
}
