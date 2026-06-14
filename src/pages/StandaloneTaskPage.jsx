import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import './StandaloneTaskPage.css'

const TASK_TYPES = ['FOT','SGH','R/I','MEL','TS','MOD','REP','INSP']
const ACTIVITIES = ['Training','Perform','Supervise','CRS']

const emptyForm = {
  standalone_date: '',
  standalone_location: '',
  standalone_ac_registration: '',
  standalone_ac_type: '',
  standalone_rating: '',
  standalone_privilege: '',
  standalone_ata: '',
  standalone_operation: '',
  standalone_ref: '',
  time_duration: '',
  remarks: '',
  task_type: {},
  activity: {}
}

function CheckGroup({ options, values, onChange }) {
  return (
    <div className="check-group">
      {options.map(opt => (
        <label key={opt} className="check-label">
          <input
            type="checkbox"
            checked={!!values[opt]}
            onChange={e => onChange(opt, e.target.checked)}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  )
}

export default function StandaloneTaskPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { taskId } = useParams()
  const isEdit = !!taskId

  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
    if (isEdit) loadTask()
    else setLoading(false)
  }, [taskId])

  async function fetchTasks() {
    const { data } = await supabase
      .from('log_entry_rows')
      .select('*')
      .eq('standalone_user_id', profile.id)
      .eq('is_standalone', true)
      .order('standalone_date', { ascending: false })
    setTasks(data || [])
  }

  async function loadTask() {
    const { data } = await supabase
      .from('log_entry_rows')
      .select('*')
      .eq('id', taskId)
      .single()
    if (!data) { navigate('/logbook/task'); return }
    setForm({
      standalone_date: data.standalone_date || '',
      standalone_location: data.standalone_location || '',
      standalone_ac_registration: data.standalone_ac_registration || '',
      standalone_ac_type: data.standalone_ac_type || '',
      standalone_rating: data.standalone_rating || '',
      standalone_privilege: data.standalone_privilege || '',
      standalone_ata: data.standalone_ata || '',
      standalone_operation: data.standalone_operation || '',
      standalone_ref: data.standalone_ref || '',
      time_duration: data.time_duration || '',
      remarks: data.remarks || '',
      task_type: {
        FOT: data.task_type_fot, SGH: data.task_type_sgh,
        'R/I': data.task_type_ri, MEL: data.task_type_mel,
        TS: data.task_type_ts, MOD: data.task_type_mod,
        REP: data.task_type_rep, INSP: data.task_type_insp
      },
      activity: {
        Training: data.activity_training, Perform: data.activity_perform,
        Supervise: data.activity_supervise, CRS: data.activity_crs
      }
    })
    setLoading(false)
  }

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function setCheck(group, key, val) {
    setForm(f => ({ ...f, [group]: { ...f[group], [key]: val } }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        is_standalone: true,
        standalone_user_id: profile.id,
        standalone_date: form.standalone_date,
        standalone_location: form.standalone_location,
        standalone_ac_registration: form.standalone_ac_registration,
        standalone_ac_type: form.standalone_ac_type,
        standalone_rating: form.standalone_rating,
        standalone_privilege: form.standalone_privilege,
        standalone_ata: form.standalone_ata,
        standalone_operation: form.standalone_operation,
        standalone_ref: form.standalone_ref,
        time_duration: form.time_duration,
        remarks: form.remarks,
        task_type_fot: !!form.task_type.FOT,
        task_type_sgh: !!form.task_type.SGH,
        task_type_ri: !!form.task_type['R/I'],
        task_type_mel: !!form.task_type.MEL,
        task_type_ts: !!form.task_type.TS,
        task_type_mod: !!form.task_type.MOD,
        task_type_rep: !!form.task_type.REP,
        task_type_insp: !!form.task_type.INSP,
        activity_training: !!form.activity.Training,
        activity_perform: !!form.activity.Perform,
        activity_supervise: !!form.activity.Supervise,
        activity_crs: !!form.activity.CRS,
      }
      if (isEdit) {
        const { error: err } = await supabase
          .from('log_entry_rows').update(payload).eq('id', taskId)
        if (err) throw err
      } else {
        const { error: err } = await supabase
          .from('log_entry_rows').insert(payload)
        if (err) throw err
      }
      setForm(emptyForm)
      await fetchTasks()
      if (isEdit) navigate('/logbook/task')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette tâche ?')) return
    await supabase.from('log_entry_rows').delete().eq('id', id)
    fetchTasks()
  }

  if (loading) return <div className="loading-msg">Chargement...</div>

  return (
    <div className="standalone-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tâche ponctuelle</h1>
          <p className="page-sub">Enregistrez une tâche individuelle par date</p>
        </div>
      </div>

      <div className="standalone-layout">
        {/* Form */}
        <div className="standalone-form-card">
          <h2 className="card-title">{isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="field">
                <label>Date</label>
                <input type="date" value={form.standalone_date} onChange={e => setField('standalone_date', e.target.value)} required />
              </div>
              <div className="field">
                <label>Location</label>
                <input value={form.standalone_location} onChange={e => setField('standalone_location', e.target.value)} placeholder="ex: DAAG" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Type d'appareil</label>
                <input value={form.standalone_ac_type} onChange={e => setField('standalone_ac_type', e.target.value)} placeholder="ex: A330-200" />
              </div>
              <div className="field">
                <label>Immatriculation</label>
                <input value={form.standalone_ac_registration} onChange={e => setField('standalone_ac_registration', e.target.value)} placeholder="ex: 7T-VJX" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Rating</label>
                <input value={form.standalone_rating} onChange={e => setField('standalone_rating', e.target.value)} placeholder="ex: B1 LINE" />
              </div>
              <div className="field">
                <label>Privilege</label>
                <input value={form.standalone_privilege} onChange={e => setField('standalone_privilege', e.target.value)} placeholder="ex: B1" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>ATA</label>
                <input value={form.standalone_ata} onChange={e => setField('standalone_ata', e.target.value)} placeholder="ex: 12-13-79" />
              </div>
              <div className="field">
                <label>Durée</label>
                <input value={form.time_duration} onChange={e => setField('time_duration', e.target.value)} placeholder="ex: 0.5 h" />
              </div>
            </div>
            <div className="field">
              <label>Opération effectuée</label>
              <input value={form.standalone_operation} onChange={e => setField('standalone_operation', e.target.value)} placeholder="Description de la tâche" required />
            </div>
            <div className="field">
              <label>Réf. document</label>
              <input value={form.standalone_ref} onChange={e => setField('standalone_ref', e.target.value)} placeholder="ex: AMM TASK 12-13-79-612-801" />
            </div>

            <div className="field">
              <label>Task Type</label>
              <CheckGroup
                options={TASK_TYPES}
                values={form.task_type}
                onChange={(k, v) => setCheck('task_type', k, v)}
              />
            </div>
            <div className="field">
              <label>Type d'activité</label>
              <CheckGroup
                options={ACTIVITIES}
                values={form.activity}
                onChange={(k, v) => setCheck('activity', k, v)}
              />
            </div>
            <div className="field">
              <label>Remarques</label>
              <input value={form.remarks} onChange={e => setField('remarks', e.target.value)} />
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div className="form-actions">
              {isEdit && (
                <button type="button" className="btn-cancel" onClick={() => navigate('/logbook/task')}>
                  Annuler
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Enregistrement...' : isEdit ? '💾 Modifier' : '+ Ajouter la tâche'}
              </button>
            </div>
          </form>
        </div>

        {/* Task list */}
        <div className="standalone-list-card">
          <h2 className="card-title">Mes tâches ponctuelles ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <div className="empty-msg">Aucune tâche enregistrée</div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Appareil</th>
                    <th>Opération</th>
                    <th>Durée</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.id}>
                      <td>{t.standalone_date}</td>
                      <td>{t.standalone_ac_type}<br /><span style={{ fontSize: '11px', color: '#64748b' }}>{t.standalone_ac_registration}</span></td>
                      <td>{t.standalone_operation}</td>
                      <td>{t.time_duration || '—'}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-edit" onClick={() => navigate(`/logbook/task/${t.id}`)}>Modifier</button>
                          <button className="btn-delete" onClick={() => handleDelete(t.id)}>Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}