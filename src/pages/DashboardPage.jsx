import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import './DashboardPage.css'

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const { data: entries } = await supabase
      .from('log_entries')
      .select('*, protocols(protocol_type, aircraft_types(name))')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    const { data: rows } = await supabase
      .from('log_entry_rows')
      .select('*')
      .eq('standalone_user_id', profile.id)
      .eq('is_standalone', true)

    const total = (entries || []).length
    const aircraft = [...new Set((entries || []).map(e => e.protocols?.aircraft_types?.name).filter(Boolean))]
    const byType = {}
    ;(entries || []).forEach(e => {
      const t = e.protocols?.protocol_type || 'other'
      byType[t] = (byType[t] || 0) + 1
    })

    setStats({ total, aircraft, byType, standalone: (rows || []).length })
    setRecent((entries || []).slice(0, 5))
    setLoading(false)
  }

  const LABELS = {
    daily: 'Daily', weekly: 'Weekly',
    line_check: 'Line Check', pre_flight: 'Pre-flight'
  }

  const TYPE_COLORS = {
    daily: { bg: '#eff6ff', color: '#1e40af', bar: '#3b82f6' },
    weekly: { bg: '#f0fdf4', color: '#166534', bar: '#22c55e' },
    line_check: { bg: '#fefce8', color: '#854d0e', bar: '#eab308' },
    pre_flight: { bg: '#fdf4ff', color: '#7e22ce', bar: '#a855f7' },
    other: { bg: '#f1f5f9', color: '#475569', bar: '#94a3b8' }
  }

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner" />
      <p>Chargement...</p>
    </div>
  )

  const maxCount = Math.max(...Object.values(stats.byType), 1)

  return (
    <div className="dashboard-page">

      {/* HERO BANNER */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="dash-greeting">{getGreeting()},</div>
          <div className="dash-name">{profile?.name} {profile?.surname}</div>
          <div className="dash-role">
            {profile?.role === 'admin' ? '⚙️ Administrateur' : '🔧 Technicien'}
            {profile?.aht_id && <span className="dash-aht">AHT: {profile.aht_id}</span>}
          </div>
        </div>
        <div className="dash-hero-actions">
          <button className="dash-btn-main" onClick={() => navigate('/logbook/new')}>
            <span>✏️</span> Nouvelle entrée
          </button>
          <button className="dash-btn-secondary" onClick={() => navigate('/history')}>
            <span>🗂️</span> Historique
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="dash-stats">
        <div className="dash-stat dash-stat-blue">
          <div className="dash-stat-top">
            <span className="dash-stat-icon">📋</span>
            <span className="dash-stat-num">{stats.total}</span>
          </div>
          <div className="dash-stat-label">Entrées protocole</div>
          <div className="dash-stat-bar" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="dash-stat-bar-fill" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="dash-stat dash-stat-green">
          <div className="dash-stat-top">
            <span className="dash-stat-icon">✈️</span>
            <span className="dash-stat-num">{stats.aircraft.length}</span>
          </div>
          <div className="dash-stat-label">Type(s) d'appareil</div>
          <div className="dash-stat-sub">{stats.aircraft.join(', ') || '—'}</div>
        </div>
        <div className="dash-stat dash-stat-purple">
          <div className="dash-stat-top">
            <span className="dash-stat-icon">➕</span>
            <span className="dash-stat-num">{stats.standalone}</span>
          </div>
          <div className="dash-stat-label">Tâches ponctuelles</div>
        </div>
        <div className="dash-stat dash-stat-orange">
          <div className="dash-stat-top">
            <span className="dash-stat-icon">🗓️</span>
            <span className="dash-stat-num">
              {stats.total + stats.standalone}
            </span>
          </div>
          <div className="dash-stat-label">Total activités</div>
        </div>
      </div>

      <div className="dash-bottom">

        {/* LEFT — Protocol breakdown */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Répartition des protocoles</h2>
            {stats.total > 0 && (
              <span className="dash-card-badge">{stats.total} entrée{stats.total > 1 ? 's' : ''}</span>
            )}
          </div>
          {Object.keys(stats.byType).length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon">📭</div>
              <p>Aucune entrée pour l'instant</p>
              <button className="dash-btn-main" style={{ marginTop: '12px' }} onClick={() => navigate('/logbook/new')}>
                Créer ma première entrée
              </button>
            </div>
          ) : (
            <div className="dash-proto-list">
              {Object.entries(stats.byType).map(([type, count]) => {
                const colors = TYPE_COLORS[type] || TYPE_COLORS.other
                const pct = Math.round((count / stats.total) * 100)
                return (
                  <div key={type} className="dash-proto-row">
                    <div className="dash-proto-info">
                      <span className="dash-proto-badge" style={{ background: colors.bg, color: colors.color }}>
                        {LABELS[type] || type}
                      </span>
                      <span className="dash-proto-pct">{pct}%</span>
                    </div>
                    <div className="dash-proto-track">
                      <div
                        className="dash-proto-fill"
                        style={{
                          width: `${(count / maxCount) * 100}%`,
                          background: colors.bar
                        }}
                      />
                    </div>
                    <span className="dash-proto-count">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT — Recent entries */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Entrées récentes</h2>
            {recent.length > 0 && (
              <button className="dash-link" onClick={() => navigate('/history')}>
                Voir tout →
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon">🗒️</div>
              <p>Aucune entrée récente</p>
            </div>
          ) : (
            <div className="dash-recent-list">
              {recent.map((e, i) => {
                const type = e.protocols?.protocol_type
                const colors = TYPE_COLORS[type] || TYPE_COLORS.other
                return (
                  <div
                    key={e.id}
                    className="dash-recent-item"
                    onClick={() => navigate(`/logbook/edit/${e.id}`)}
                  >
                    <div className="dash-recent-num">{i + 1}</div>
                    <div className="dash-recent-body">
                      <div className="dash-recent-top">
                        <span className="dash-recent-aircraft">
                          {e.ac_type || e.protocols?.aircraft_types?.name || '—'}
                        </span>
                        <span
                          className="dash-recent-type"
                          style={{ background: colors.bg, color: colors.color }}
                        >
                          {LABELS[type] || '—'}
                        </span>
                      </div>
                      <div className="dash-recent-meta">
                        {e.date && <span>📅 {e.date}</span>}
                        {e.location && <span>📍 {e.location}</span>}
                        {e.ac_registration && <span>✈️ {e.ac_registration}</span>}
                      </div>
                    </div>
                    <div className="dash-recent-arrow">→</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* QUICK ACTIONS */}
      <div className="dash-quick">
        <div className="dash-quick-title">Accès rapide</div>
        <div className="dash-quick-grid">
          <button className="dash-quick-btn" onClick={() => navigate('/logbook/new')}>
            <span>✏️</span><span>Nouvelle entrée</span>
          </button>
          <button className="dash-quick-btn" onClick={() => navigate('/logbook/task')}>
            <span>➕</span><span>Tâche ponctuelle</span>
          </button>
          <button className="dash-quick-btn" onClick={() => navigate('/cover')}>
            <span>📄</span><span>Mon carnet</span>
          </button>
          <button className="dash-quick-btn" onClick={() => navigate('/infos')}>
            <span>👤</span><span>Mon profil</span>
          </button>
          {profile?.role === 'admin' && (
            <>
              <button className="dash-quick-btn" onClick={() => navigate('/admin/users')}>
                <span>👥</span><span>Utilisateurs</span>
              </button>
              <button className="dash-quick-btn" onClick={() => navigate('/admin/protocols')}>
                <span>🔧</span><span>Protocoles</span>
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  )
}