import React from 'react'
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation
} from 'react-router-dom'

import Navbar from './components/Navbar/Navbar'
import Footer from './components/footer/Footer'
import Home from './components/pages/Home'
import Analises from './components/pages/Analises'
import Dados from './components/pages/Dados'
import GestaoArquivos from './components/pages/GestaoArquivos'
import PrevisaoReceitas from './components/pages/PrevisaoReceitas'
import PaginaInstitucional from './components/pages/PaginaInstitucional'
import Login from './components/pages/Login'
import AnaliseDetalhes from './components/pages/PagesDetalhes/AnaliseDetalhes'
import ProtectedRoute from './routes/ProtectedRoute'
import './App.css'

const AppContent = () => {
  const location = useLocation()
  const paginaDeLogin = location.pathname.toLowerCase() === '/login'

  return (
    <div className={paginaDeLogin ? 'container container-login' : 'container'}>
      {!paginaDeLogin && <Navbar />}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/Analises" element={<ProtectedRoute><Analises /></ProtectedRoute>} />

        {/* Preserva o acesso PIB somente para administradores. */}
        <Route
          path="/Analises/PIB"
          element={<ProtectedRoute perfisPermitidos={['admin']}><AnaliseDetalhes /></ProtectedRoute>}
        />

        {/* O menu Dados passa a mostrar o catálogo, sem eliminar o upload administrativo. */}
        <Route
          path="/Dados"
          element={<ProtectedRoute perfisPermitidos={['admin', 'analista']}><Dados /></ProtectedRoute>}
        />
        <Route
          path="/Dados/Arquivos"
          element={<ProtectedRoute perfisPermitidos={['admin']}><GestaoArquivos /></ProtectedRoute>}
        />
        <Route
          path="/Dados/Previsao-Receitas"
          element={<ProtectedRoute perfisPermitidos={['admin', 'analista']}><PrevisaoReceitas /></ProtectedRoute>}
        />

        {/* Rota reservada para futura integração via VPN/GitLab; sem link no catálogo. */}
        <Route
          path="/Dados/Institucional"
          element={<ProtectedRoute perfisPermitidos={['admin', 'analista']}><PaginaInstitucional /></ProtectedRoute>}
        />

        {/* População e Filmes: rotas de demonstração removidas. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!paginaDeLogin && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}
