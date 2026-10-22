import React, { useState } from 'react'
import DashboardLavouras from './DashboardLavouras'
import DashboardPecuaria from './DashboardPecuaria'
import './DashboardAgropecuaria.css'

const SECOES = [
  { id: 'lavouras', nome: 'Lavouras' },
  { id: 'animais', nome: 'Bovinos, Suínos e Aves' },
  { id: 'produtos', nome: 'Leite e Ovos' }
]

export default function DashboardAgropecuaria() {
  const [secao, setSecao] = useState('lavouras')
  return (
    <div className="agro-integrado">
      <nav className="agro-subabas" aria-label="Subáreas da agropecuária">
        {SECOES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`agro-subaba ${secao === item.id ? 'agro-subaba-ativa' : ''}`}
            aria-pressed={secao === item.id}
            onClick={() => setSecao(item.id)}
          >
            {item.nome}
          </button>
        ))}
      </nav>
      <div className="agro-painel" aria-live="off">
        {secao === 'lavouras' ? <DashboardLavouras /> : <DashboardPecuaria grupo={secao} />}
      </div>
    </div>
  )
}
