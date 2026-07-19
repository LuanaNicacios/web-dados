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
import Login from './components/pages/Login'

import AnaliseDetalhes from './components/pages/PagesDetalhes/AnaliseDetalhes'

import ProtectedRoute from './routes/ProtectedRoute'

import './App.css'

const AppContent = () => {
  const location = useLocation()

  const paginaDeLogin =
    location.pathname.toLowerCase() === '/login'

  return (
    <div
      className={
        paginaDeLogin
          ? 'container container-login'
          : 'container'
      }
    >
      {!paginaDeLogin && <Navbar />}

      <Routes>

        {/* Rota pública */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Rotas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Analises"
          element={
            <ProtectedRoute>
              <Analises />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Analises/Populacao"
          element={
            <ProtectedRoute>
              <AnaliseDetalhes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Analises/PIB"
          element={
            <ProtectedRoute>
              <AnaliseDetalhes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Analises/Filmes"
          element={
            <ProtectedRoute>
              <AnaliseDetalhes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Dados"
          element={
            <ProtectedRoute>
              <Dados />
            </ProtectedRoute>
          }
        />

        {/* Qualquer endereço inexistente */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

      {!paginaDeLogin && <Footer />}
    </div>
  )
}

const App = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}

export default App
