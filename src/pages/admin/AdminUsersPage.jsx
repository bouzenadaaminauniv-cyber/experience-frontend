import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import './AdminUsersPage.css'

const emptyForm = {
  email: '',
  password: '',
  role: 'user'
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileForm, setProfileForm] = useState({})
  const [profileUser, setProfileUser] = useState(null)

  function openProfileEdit(user) {
    setProfileUser(user)
    setProfileForm({
      name: user.name || '',
      surname: user.surname || '',
      date_of_birth: user.date_of_birth || '',
      place_of_birth: user.place_of_birth || '',
      aht_id: user.aht_id || '',
      authorization_nr: user.authorization_nr || '',
      scope_of_authorization: user.scope_of_authorization || '',
      role: user.role || 'user'
    })
    setShowProfileModal(true)
  }

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`http://localhost:3001/api/users/${profileUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      })
      if (!res.ok) throw new Error('Erreur')
      await fetchUsers()
      setShowProfileModal(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  function openCreate() {
    setEditingUser(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  function openEdit(user) {
    setEditingUser(user)
    setForm({
      email: user.email || '',
      password: '',
      role: user.role || 'user'
    })
    setError('')
    setShowModal(true)
  }
  function closeModal() {
    setShowModal(false)
    setEditingUser(null)
    setForm(emptyForm)
    setError('')
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingUser) {
        // Update role
        const { error: err } = await supabase
          .from('users')
          .update({ role: form.role })
          .eq('id', editingUser.id)
        if (err) throw err
        // Update password if provided
        if (form.password) {
          const res = await fetch(`http://localhost:3001/api/users/${editingUser.id}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: form.password })
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Erreur mot de passe')
        }
      } else {
        const res = await fetch('http://localhost:3001/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur création')
      }
      await fetchUsers()
      closeModal()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(user) {
    if (!confirm(`Supprimer ${user.name} ${user.surname} ?`)) return
    const res = await fetch(`http://localhost:3001/api/users/${user.id}`, { method: 'DELETE' })
    if (res.ok) fetchUsers()
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="page-sub">{users.length} compte(s) enregistré(s)</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Nouvel utilisateur</button>
      </div>

      {loading ? (
        <div className="loading-msg">Chargement...</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>AHT ID</th>
                <th>N° Autorisation</th>
                <th>Rôle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><span className="user-fullname">{u.name} {u.surname}</span></td>
                  <td>{u.email}</td>
                  <td>{u.aht_id || '—'}</td>
                  <td>{u.authorization_nr || '—'}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Technicien'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-edit" onClick={() => openEdit(u)}>Modifier</button>
                      <button className="btn-delete" onClick={() => handleDelete(u)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="field">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={!!editingUser}
                />
              </div>
              {!editingUser && (
                <div className="field">
                  <label>Mot de passe</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Laisser vide = Technics2024!"
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Mot de passe par défaut : <strong>Technics2024!</strong>
                  </span>
                </div>
              )}
              {editingUser && (
                <div className="field">
                  <label>Nouveau mot de passe (laisser vide = inchangé)</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                </div>
              )}
              <div className="field">
                <label>Rôle</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="user">Technicien</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              {error && <div className="error-msg">{error}</div>}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
               
              </div>
            </form>
          </div>
        </div>
      )}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Profil — {profileUser?.email}</h2>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>✕</button>
            </div>
            <form onSubmit={handleProfileSubmit} className="modal-form">
              <div className="form-row">
                <div className="field">
                  <label>Prénom</label>
                  <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Nom</label>
                  <input value={profileForm.surname} onChange={e => setProfileForm(f => ({ ...f, surname: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Date de naissance</label>
                  <input type="date" value={profileForm.date_of_birth} onChange={e => setProfileForm(f => ({ ...f, date_of_birth: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Lieu de naissance</label>
                  <input value={profileForm.place_of_birth} onChange={e => setProfileForm(f => ({ ...f, place_of_birth: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>AHT ID</label>
                  <input value={profileForm.aht_id} onChange={e => setProfileForm(f => ({ ...f, aht_id: e.target.value }))} />
                </div>
                <div className="field">
                  <label>N° Autorisation</label>
                  <input value={profileForm.authorization_nr} onChange={e => setProfileForm(f => ({ ...f, authorization_nr: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Périmètre d'autorisation</label>
                <input value={profileForm.scope_of_authorization} onChange={e => setProfileForm(f => ({ ...f, scope_of_authorization: e.target.value }))} />
              </div>
              <div className="field">
                <label>Rôle</label>
                <select value={profileForm.role} onChange={e => setProfileForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="user">Technicien</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowProfileModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
