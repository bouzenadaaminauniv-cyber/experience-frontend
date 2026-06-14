import { useEffect, useState } from 'react'
import '../admin/AdminUsersPage.css'
import './AdminProtocolsPage.css'

const API = `${import.meta.env.VITE_API_URL}/api/protocols`

const PROTOCOL_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'line_check', label: 'Line Check' },
  { value: 'pre_flight', label: 'Pre-flight' }
]

const emptyProtocol = {
  aircraft_type_id: '',
  protocol_type: 'daily',
  auto_fill: false
}

const emptyTask = {
  ata: '',
  operation_performed: '',
  maintenance_record_ref: '',
  time_duration: ''
}

export default function AdminProtocolsPage() {
  const [protocols, setProtocols] = useState([])
  const [aircraft, setAircraft] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProtocolModal, setShowProtocolModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showAircraftModal, setShowAircraftModal] = useState(false)
  const [editingProtocol, setEditingProtocol] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [selectedProtocol, setSelectedProtocol] = useState(null)
  const [tasks, setTasks] = useState([])
  const [protocolForm, setProtocolForm] = useState(emptyProtocol)
  const [taskForm, setTaskForm] = useState(emptyTask)
  const [aircraftForm, setAircraftForm] = useState({ name: '', engine: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [p, a] = await Promise.all([
      fetch(API).then(r => r.json()),
      fetch(API + '/aircraft').then(r => r.json())
    ])
    setProtocols(Array.isArray(p) ? p : [])
    setAircraft(Array.isArray(a) ? a : [])
    setLoading(false)
  }

  async function fetchTasks(protocolId) {
    const data = await fetch(API + '/' + protocolId + '/tasks').then(r => r.json())
    setTasks(Array.isArray(data) ? data : [])
  }

  function openProtocolCreate() {
    setEditingProtocol(null)
    setProtocolForm(emptyProtocol)
    setError('')
    setShowProtocolModal(true)
  }

  function openProtocolEdit(p) {
    setEditingProtocol(p)
    setProtocolForm({
      aircraft_type_id: p.aircraft_type_id,
      protocol_type: p.protocol_type,
      auto_fill: p.auto_fill || false
    })
    setError('')
    setShowProtocolModal(true)
  }

  async function handleProtocolSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const method = editingProtocol ? 'PUT' : 'POST'
      const url = editingProtocol ? `${API}/${editingProtocol.id}` : API
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(protocolForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchAll()
      if (!editingProtocol) {
        setSelectedProtocol(data)
        await fetchTasks(data.id)
      }
      setShowProtocolModal(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleProtocolDelete(p) {
    if (!confirm('Supprimer le protocole ' + p.protocol_type + ' ?')) return
    await fetch(API + '/' + p.id, { method: 'DELETE' })
    if (selectedProtocol?.id === p.id) { setSelectedProtocol(null); setTasks([]) }
    fetchAll()
  }

  async function selectProtocol(p) {
    setSelectedProtocol(p)
    await fetchTasks(p.id)
  }

  function openTaskCreate() {
    setEditingTask(null)
    setTaskForm(emptyTask)
    setError('')
    setShowTaskModal(true)
  }

  function openTaskEdit(t) {
    setEditingTask(t)
    setTaskForm({
      ata: t.ata || '',
      operation_performed: t.operation_performed,
      maintenance_record_ref: t.maintenance_record_ref || '',
      time_duration: t.time_duration || ''
    })
    setError('')
    setShowTaskModal(true)
  }

  async function handleTaskSubmit(e) {
    e.preventDefault()
    if (!selectedProtocol) {
      setError('Veuillez d\'abord sélectionner ou créer un protocole.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingTask) {
        const res = await fetch(`${API}/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...taskForm,
            order: editingTask.order,
            is_active: editingTask.is_active !== false
          })
        })
        if (!res.ok) throw new Error('Erreur modification')
      } else {
        const res = await fetch(`${API}/${selectedProtocol.id}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...taskForm, order: tasks.length })
        })
        if (!res.ok) throw new Error('Erreur création')
      }
      await fetchTasks(selectedProtocol.id)
      setShowTaskModal(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleTaskDelete(t) {
    if (!confirm('Supprimer cette tâche ?')) return
    await fetch(API + '/tasks/' + t.id, { method: 'DELETE' })
    fetchTasks(selectedProtocol.id)
  }

  async function moveTask(index, direction) {
    const newTasks = [...tasks]
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= newTasks.length) return
    const temp = newTasks[index]
    newTasks[index] = newTasks[swapIndex]
    newTasks[swapIndex] = temp
    const updated = newTasks.map((t, i) => ({ ...t, order: i }))
    setTasks(updated)
    await Promise.all(updated.map(t =>
      fetch(API + '/tasks/' + t.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ata: t.ata,
          operation_performed: t.operation_performed,
          maintenance_record_ref: t.maintenance_record_ref,
          time_duration: t.time_duration,
          order: t.order,
          is_active: t.is_active !== false
        })
      })
    ))
  }

  async function handleAircraftSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(API + '/aircraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aircraftForm)
      })
      if (!res.ok) throw new Error('Erreur')
      setAircraftForm({ name: '', engine: '' })
      await fetchAll()
      setShowAircraftModal(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAircraftDelete(id) {
    if (!confirm('Supprimer cet appareil ?')) return
    await fetch(API + '/aircraft/' + id, { method: 'DELETE' })
    fetchAll()
  }

  const protocolTypeLabel = v => PROTOCOL_TYPES.find(t => t.value === v)?.label || v

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Protocoles</h1>
          <p className="page-sub">{protocols.length} protocole(s) configuré(s)</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => { setError(''); setShowAircraftModal(true) }}>
            + Type d'appareil
          </button>
          <button className="btn-primary" onClick={openProtocolCreate}>
            + Nouveau protocole
          </button>
        </div>
      </div>

      {loading ? <div className="loading-msg">Chargement...</div> : (
        <div className="protocols-layout">

          {/* LEFT — Protocol list */}
          <div className="protocols-list">
            <div className="list-header">Protocoles</div>
            {protocols.length === 0 && (
              <div className="empty-msg">Aucun protocole</div>
            )}
            {protocols.map(p => (
              <div
                key={p.id}
                className={'protocol-item' + (selectedProtocol?.id === p.id ? ' selected' : '')}
                onClick={() => selectProtocol(p)}
              >
                <div className="protocol-item-main">
                  <span className="protocol-aircraft">{p.aircraft_types?.name || '—'}</span>
                  <span className="protocol-type-badge">{protocolTypeLabel(p.protocol_type)}</span>
                </div>
                {/* <div className="protocol-item-sub">
                  Rating: {p.rating} · Privilege: {p.privilege}
                  {p.auto_fill && <span style={{ marginLeft: '6px', color: '#1e40af', fontSize: '10px' }}>⚡ Auto</span>}
                </div> */}
                <div className="action-btns" style={{ marginTop: '8px' }} onClick={e => e.stopPropagation()}>
                  <button className="btn-edit" onClick={() => openProtocolEdit(p)}>Modifier</button>
                  <button
                    className="btn-edit"
                    style={{ color: '#7c3aed', borderColor: '#ddd6fe' }}
                    onClick={() => window.open(`/admin/protocols/preview/${p.id}`, '_blank')}
                  >
                    👁 Aperçu
                  </button>
                  <button className="btn-delete" onClick={() => handleProtocolDelete(p)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT — Tasks panel */}
          <div className="tasks-panel">
            {!selectedProtocol ? (
              <div className="empty-msg">
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>👆</div>
                <p>Sélectionnez un protocole</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  ou créez un nouveau protocole
                </p>
              </div>
            ) : (
              <>
                <div className="tasks-header">
                  <div>
                    <div className="tasks-title">
                      {selectedProtocol.aircraft_types?.name} — {protocolTypeLabel(selectedProtocol.protocol_type)}
                    </div>
                    <div className="tasks-sub">{tasks.length} tâche(s)</div>
                  </div>
                  <button className="btn-primary" onClick={openTaskCreate}>+ Ajouter tâche</button>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th style={{ width: '80px' }}>ATA</th>
                        <th>Opération</th>
                        <th>Durée</th>
                        <th>Réf. document</th>
                        <th style={{ width: '130px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((t, i) => (
                        <tr key={t.id} style={{ opacity: t.is_active !== false ? 1 : 0.4 }}>
                          <td>
                            <div className="order-btns">
                              <button onClick={() => moveTask(i, -1)} disabled={i === 0}>▲</button>
                              <button onClick={() => moveTask(i, 1)} disabled={i === tasks.length - 1}>▼</button>
                            </div>
                          </td>
                          <td><span className="ata-badge">{t.ata || '—'}</span></td>
                          <td>{t.operation_performed}</td>
                          <td>{t.time_duration || '—'}</td>
                          <td>{t.maintenance_record_ref || '—'}</td>
                          <td>
                            <div className="action-btns">
                              <button
                                className="btn-edit"
                                style={{
                                  color: t.is_active !== false ? '#166534' : '#dc2626',
                                  borderColor: t.is_active !== false ? '#86efac' : '#fecaca',
                                  fontSize: '11px'
                                }}
                                onClick={async () => {
                                  await fetch(`${API}/tasks/${t.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      ata: t.ata,
                                      operation_performed: t.operation_performed,
                                      maintenance_record_ref: t.maintenance_record_ref,
                                      time_duration: t.time_duration,
                                      order: t.order,
                                      is_active: !(t.is_active !== false)
                                    })
                                  })
                                  fetchTasks(selectedProtocol.id)
                                }}
                              >
                                {t.is_active !== false ? '✓' : '✗'}
                              </button>
                              <button className="btn-edit" onClick={() => openTaskEdit(t)}>Modifier</button>
                              <button className="btn-delete" onClick={() => handleTaskDelete(t)}>Sup.</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* PROTOCOL MODAL */}
      {showProtocolModal && (
        <div className="modal-overlay" onClick={() => setShowProtocolModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProtocol ? 'Modifier protocole' : 'Nouveau protocole'}</h2>
              <button className="modal-close" onClick={() => setShowProtocolModal(false)}>✕</button>
            </div>
            <form onSubmit={handleProtocolSubmit} className="modal-form">
              <div className="field">
                <label>Type d'appareil <span style={{ color: '#dc2626' }}>*</span></label>
                <select
                  value={protocolForm.aircraft_type_id}
                  onChange={e => setProtocolForm(f => ({ ...f, aircraft_type_id: e.target.value }))}
                  required
                >
                  <option value="">— Sélectionner un appareil —</option>
                  {aircraft.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.engine ? ` (${a.engine})` : ''}
                    </option>
                  ))}
                </select>
                {aircraft.length === 0 && (
                  <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                    Aucun appareil disponible. Créez d'abord un type d'appareil via le bouton "+ Type d'appareil".
                  </span>
                )}
              </div>
              <div className="field">
                <label>Type de protocole <span style={{ color: '#dc2626' }}>*</span></label>
                <select
                  value={protocolForm.protocol_type}
                  onChange={e => setProtocolForm(f => ({ ...f, protocol_type: e.target.value }))}
                >
                  {PROTOCOL_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                {/* <div className="field">
                  <label>Rating <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    value={protocolForm.rating}
                    onChange={e => setProtocolForm(f => ({ ...f, rating: e.target.value }))}
                    placeholder="ex: B1 LINE"
                    required
                  />
                </div>
                <div className="field">
                  <label>Privilege <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    value={protocolForm.privilege}
                    onChange={e => setProtocolForm(f => ({ ...f, privilege: e.target.value }))}
                    placeholder="ex: B1"
                    required
                  />
                </div> */}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="auto_fill"
                  checked={protocolForm.auto_fill || false}
                  onChange={e => setProtocolForm(f => ({ ...f, auto_fill: e.target.checked }))}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                />
                <label htmlFor="auto_fill" style={{ cursor: 'pointer', fontSize: '13px', color: '#374151', margin: 0 }}>
                  Remplissage automatique (copier la 1ère ligne sur toutes les tâches)
                </label>
              </div>
              {error && <div className="error-msg">{error}</div>}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowProtocolModal(false)}>
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving || !protocolForm.aircraft_type_id}
                >
                  {saving ? 'Enregistrement...' : editingProtocol ? 'Modifier' : 'Créer le protocole'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK MODAL */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'Modifier tâche' : 'Nouvelle tâche'}</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <form onSubmit={handleTaskSubmit} className="modal-form">
              <div className="form-row">
                <div className="field">
                  <label>Chapitre ATA (col. 9)</label>
                  <input
                    value={taskForm.ata}
                    onChange={e => setTaskForm(f => ({ ...f, ata: e.target.value }))}
                    placeholder="ex: 12-10"
                  />
                </div>
                <div className="field">
                  <label>Durée (col. 11)</label>
                  <input
                    value={taskForm.time_duration}
                    onChange={e => setTaskForm(f => ({ ...f, time_duration: e.target.value }))}
                    placeholder="ex: 0.5 h"
                  />
                </div>
              </div>
              <div className="field">
                <label>Opération effectuée (col. 10) <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  value={taskForm.operation_performed}
                  onChange={e => setTaskForm(f => ({ ...f, operation_performed: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label>Réf. document maintenance (col. 12)</label>
                <input
                  value={taskForm.maintenance_record_ref}
                  onChange={e => setTaskForm(f => ({ ...f, maintenance_record_ref: e.target.value }))}
                />
              </div>
              {error && <div className="error-msg">{error}</div>}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowTaskModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AIRCRAFT MODAL */}
      {showAircraftModal && (
        <div className="modal-overlay" onClick={() => setShowAircraftModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Types d'appareils</h2>
              <button className="modal-close" onClick={() => setShowAircraftModal(false)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="table-wrapper" style={{ marginBottom: '16px' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Appareil</th><th>Moteur</th><th></th></tr>
                  </thead>
                  <tbody>
                    {aircraft.length === 0 && (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8' }}>Aucun appareil</td></tr>
                    )}
                    {aircraft.map(a => (
                      <tr key={a.id}>
                        <td>{a.name}</td>
                        <td>{a.engine || '—'}</td>
                        <td>
                          <button className="btn-delete" onClick={() => handleAircraftDelete(a.id)}>
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <form onSubmit={handleAircraftSubmit}>
                <div className="form-row">
                  <div className="field">
                    <label>Nom appareil</label>
                    <input
                      value={aircraftForm.name}
                      onChange={e => setAircraftForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="ex: A330-200"
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Moteur</label>
                    <input
                      value={aircraftForm.engine}
                      onChange={e => setAircraftForm(f => ({ ...f, engine: e.target.value }))}
                      placeholder="ex: GE CF6"
                    />
                  </div>
                </div>
                <div className="modal-actions" style={{ marginTop: '12px' }}>
                  <button type="submit" className="btn-primary" disabled={saving}>+ Ajouter</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}