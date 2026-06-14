import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminProtocolsPage from './pages/admin/AdminProtocolsPage'
import AdminEntriesPage from './pages/admin/AdminEntriesPage'
import HistoryPage from './pages/HistoryPage'
import LogbookNewPage from './pages/LogbookNewPage'
import LogbookPreviewPage from './pages/LogbookPreviewPage'
import InfosPage from './pages/InfosPage'
import StandaloneTaskPage from './pages/StandaloneTaskPage'
import AdminProtocolPreviewPage from './pages/admin/AdminProtocolPreviewPage'
import CoverPage from './pages/CoverPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Chargement...</div>
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="loading">Chargement...</div>
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/cover" element={<PrivateRoute><CoverPage /></PrivateRoute>} />
        <Route path="/admin/protocols/preview/:protocolId" element={<AdminRoute><AdminProtocolPreviewPage /></AdminRoute>} />
        <Route path="/logbook/task" element={<PrivateRoute><StandaloneTaskPage /></PrivateRoute>} />
        <Route path="/logbook/task/:taskId" element={<PrivateRoute><StandaloneTaskPage /></PrivateRoute>} />
        <Route path="/infos" element={<PrivateRoute><InfosPage /></PrivateRoute>} />
        <Route path="/logbook/preview/:entryId" element={<PrivateRoute><LogbookPreviewPage /></PrivateRoute>} />
        <Route path="/logbook/edit/:entryId" element={<PrivateRoute><LogbookNewPage /></PrivateRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
        <Route path="/logbook/new" element={<PrivateRoute><LogbookNewPage /></PrivateRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/protocols" element={<AdminRoute><AdminProtocolsPage /></AdminRoute>} />
        {/* <Route path="/admin/entries" element={<AdminRoute><AdminEntriesPage /></AdminRoute>} /> */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}