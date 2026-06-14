import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

export default function Layout({ children }) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-main">TECHNICS</span>
          <span className="logo-sub">DACM.AMO.01</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">📋</span>
            <span>Tableau de bord</span>
          </NavLink>

          <NavLink to="/logbook/new" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">✏️</span>
            <span>Nouvelle entrée</span>
          </NavLink>

          <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">🗂️</span>
            <span>Historique</span>
          </NavLink>

          <NavLink to="/logbook/task" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">➕</span>
            <span>Tâche ponctuelle</span>
          </NavLink>

          <NavLink to="/cover" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">📄</span>
            <span>Mon carnet</span>
          </NavLink>

          <NavLink to="/infos" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">👤</span>
            <span>Mon profil</span>
          </NavLink>

          {profile?.role === 'admin' && (
            <>
              <div className="nav-divider">Administration</div>
              <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <span className="nav-icon">👥</span>
                <span>Utilisateurs</span>
              </NavLink>
              <NavLink to="/admin/protocols" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <span className="nav-icon">🔧</span>
                <span>Protocoles</span>
              </NavLink>
              {/* <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <span className="nav-icon">⚙️</span>
                <span>Paramètres</span>
              </NavLink> */}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{profile?.name} {profile?.surname}</span>
            <span className="user-role">{profile?.role === 'admin' ? 'Administrateur' : 'Technicien'}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Quitter
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}