import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import '../pages/admin/AdminUsersPage.css'

const PROTOCOL_LABELS = {
  daily: 'Daily', weekly: 'Weekly',
  line_check: 'Line Check', pre_flight: 'Pre-flight'
}

export default function HistoryPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { fetchEntries() }, [])

  async function fetchEntries() {
    setLoading(true)
    const { data } = await supabase
      .from('log_entries')
      .select('*, protocols(protocol_type, rating, aircraft_types(name))')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette entrée ?')) return
    setDeletingId(id)
    try {
      const { error: rowsErr } = await supabase
        .from('log_entry_rows')
        .delete()
        .eq('log_entry_id', id)
      if (rowsErr) throw rowsErr

      const { error: entryErr } = await supabase
        .from('log_entries')
        .delete()
        .eq('id', id)
      if (entryErr) throw entryErr

      setEntries(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      alert('Erreur suppression: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Historique</h1>
          <p className="page-sub">{entries.length} entrée(s) enregistrée(s)</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/logbook/new')}>
          + Nouvelle entrée
        </button>
      </div>

      {loading ? (
        <div className="loading-msg">Chargement...</div>
      ) : entries.length === 0 ? (
        <div className="loading-msg">
          Aucune entrée. <button className="btn-primary" style={{ marginLeft: '12px' }} onClick={() => navigate('/logbook/new')}>Créer une entrée</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Appareil</th>
                <th>Protocole</th>
                <th>Immatriculation</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td>{e.date || '—'}</td>
                  <td><strong>{e.protocols?.aircraft_types?.name || e.ac_type || '—'}</strong></td>
                  <td>
                    <span className="badge badge-user">
                      {PROTOCOL_LABELS[e.protocols?.protocol_type] || '—'}
                    </span>
                  </td>
                  <td>{e.ac_registration || '—'}</td>
                  <td>{e.location || '—'}</td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="btn-edit"
                        onClick={() => navigate(`/logbook/edit/${e.id}`)}
                      >
                        Modifier
                      </button>
                      <button
                        className="btn-edit"
                        style={{ color: '#7c3aed', borderColor: '#ddd6fe' }}
                        onClick={() => navigate(`/logbook/preview/${e.id}`)}
                      >
                        👁 Aperçu
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(e.id)}
                        disabled={deletingId === e.id}
                      >
                        {deletingId === e.id ? '...' : 'Supprimer'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}