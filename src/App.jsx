import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import axios from 'axios'
import Assessment from './pages/Assessment.jsx'
import Results from './pages/Results.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminConsole from './pages/AdminConsole.jsx'
import { useAuthStore } from './stores/authStore.js'

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.accessToken)
  const authReady = useAuthStore((s) => s.authReady)
  if (!authReady) return <div className="min-h-screen bg-[#0b0e17]" />
  return token ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const setAuthReady = useAuthStore((s) => s.setAuthReady)

  useEffect(() => {
    axios
      .post('/api/v1/auth/refresh/', {}, { withCredentials: true })
      .then(({ data }) => setAccessToken(data.access))
      .catch(() => {})
      .finally(() => setAuthReady())
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Assessment />} />
        <Route path="/results/:sessionId" element={<Results />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminConsole />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
