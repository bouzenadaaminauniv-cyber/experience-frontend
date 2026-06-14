import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import './InfosPage.css'

export default function InfosPage() {
  const { profile, fetchProfile } = useAuth()
  const [form, setForm] = useState({
    name: '', surname: '', date_of_birth: '',
    place_of_birth: '', aht_id: '',
    authorization_nr: '', scope_of_authorization: ''
  })
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [success, setSuccess] = useState('')
  const [successPwd, setSuccessPwd] = useState('')
  const [error, setError] = useState('')
  const [errorPwd, setErrorPwd] = useState('')

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        surname: profile.surname || '',
        date_of_birth: profile.date_of_birth || '',
        place_of_birth: profile.place_of_birth || '',
        aht_id: profile.aht_id || '',
        authorization_nr: profile.authorization_nr || '',
        scope_of_authorization: profile.scope_of_authorization || ''
      })
    }
  }, [profile])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    const { error: err } = await supabase
      .from('users')
      .update({
        name: form.name,
        surname: form.surname,
        date_of_birth: form.date_of_birth || null,
        place_of_birth: form.place_of_birth,
        aht_id: form.aht_id,
        authorization_nr: form.authorization_nr,
        scope_of_authorization: form.scope_of_authorization
      })
      .eq('id', profile.id)
    if (err) setError(err.message)
    else {
      setSuccess('Profil mis à jour avec succès.')
      await fetchProfile(profile.id)
    }
    setSaving(false)
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setErrorPwd('')
    setSuccessPwd('')
    if (newPwd !== confirmPwd) { setErrorPwd('Les mots de passe ne correspondent pas.'); return }
    if (newPwd.length < 6) { setErrorPwd('Au moins 6 caractères requis.'); return }
    setSavingPwd(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPwd })
    if (err) setErrorPwd(err.message)
    else { setSuccessPwd('Mot de passe modifié avec succès.'); setNewPwd(''); setConfirmPwd('') }
    setSavingPwd(false)
  }

  return (
    <div className="infos-page">
      <h1 className="page-title">Mon profil</h1>

      {/* Editable profile form */}
      <div className="info-card">
        <h2 className="card-title">Informations personnelles</h2>
        <form onSubmit={handleSaveProfile}>
          <div className="info-grid">
            <div className="field">
              <label>Prénom</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Prénom" />
            </div>
            <div className="field">
              <label>Nom</label>
              <input name="surname" value={form.surname} onChange={handleChange} placeholder="Nom" />
            </div>
            <div className="field">
              <label>Date de naissance</label>
              <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Lieu de naissance</label>
              <input name="place_of_birth" value={form.place_of_birth} onChange={handleChange} placeholder="Ville, Pays" />
            </div>
            <div className="field">
              <label>AHT ID</label>
              <input name="aht_id" value={form.aht_id} onChange={handleChange} placeholder="AHT-XXXXX" />
            </div>
            <div className="field">
              <label>N° Autorisation</label>
              <input name="authorization_nr" value={form.authorization_nr} onChange={handleChange} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Périmètre d'autorisation</label>
              <input name="scope_of_authorization" value={form.scope_of_authorization} onChange={handleChange} placeholder="ex: B1 LINE A330, ATR" />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', color: '#64748b' }}>Email (non modifiable)</label>
              <input value={profile?.email || ''} disabled style={{ background: '#f8fafc', color: '#94a3b8' }} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', color: '#64748b' }}>Rôle</label>
              <span className={`badge ${profile?.role === 'admin' ? 'badge-admin' : 'badge-user'}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                {profile?.role === 'admin' ? 'Administrateur' : 'Technicien'}
              </span>
            </div>
          </div>
          {error && <div className="error-msg" style={{ marginTop: '12px' }}>{error}</div>}
          {success && <div className="success-msg" style={{ marginTop: '12px' }}>{success}</div>}
          <div className="form-actions" style={{ marginTop: '16px' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : '💾 Sauvegarder le profil'}
            </button>
          </div>
        </form>
      </div>

      {/* Password change */}
      <div className="info-card">
        <h2 className="card-title">Changer le mot de passe</h2>
        <form onSubmit={handlePasswordChange} className="pwd-form">
          <div className="field">
            <label>Nouveau mot de passe</label>
            <input
              type="password" value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              placeholder="••••••••" required
            />
          </div>
          <div className="field">
            <label>Confirmer le mot de passe</label>
            <input
              type="password" value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="••••••••" required
            />
          </div>
          {errorPwd && <div className="error-msg">{errorPwd}</div>}
          {successPwd && <div className="success-msg">{successPwd}</div>}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={savingPwd}>
              {savingPwd ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}