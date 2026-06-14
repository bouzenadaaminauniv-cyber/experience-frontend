import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useSuggestions } from '../hooks/useSuggestions'
import SuggestInput from '../components/SuggestInput'
import './LogbookNewPage.css'


const TASK_TYPES = ['FOT', 'SGH', 'R/I', 'MEL', 'TS', 'MOD', 'REP', 'INSP']
const ACTIVITIES = ['Training', 'Perform', 'Supervise', 'CRS']
const PROTOCOL_TYPES = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'line_check', label: 'Line Check' },
    { value: 'pre_flight', label: 'Pre-flight' }
]

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

export default function LogbookNewPage() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const { entryId } = useParams()
    const isEdit = !!entryId

    const [step, setStep] = useState(1)
    const [aircraft, setAircraft] = useState([])
    const [protocols, setProtocols] = useState([])
    const [selectedTasks, setSelectedTasks] = useState(new Set())
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(isEdit)

    const [selectedAircraft, setSelectedAircraft] = useState('')
    const [selectedProtocolType, setSelectedProtocolType] = useState('')
    const [selectedProtocol, setSelectedProtocol] = useState(null)

    // const [entryDate, setEntryDate] = useState('')
    // const [location, setLocation] = useState('')
    // const [acReg, setAcReg] = useState('')

    const [rows, setRows] = useState({})

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    // Step 2 — common fields (cols 1-6)
    const [entryDate, setEntryDate] = useState('')
    const [location, setLocation] = useState('')
    const [acType, setAcType] = useState('')
    const [acReg, setAcReg] = useState('')
    const [rating, setRating] = useState('')
    const [privilege, setPrivilege] = useState('')

    const suggestions = useSuggestions(profile?.id)

    const [autoFill, setAutoFill] = useState(false)

    // Load aircraft types
    useEffect(() => {
        supabase.from('aircraft_types').select('*').order('name')
            .then(({ data }) => setAircraft(data || []))
    }, [])

    // Load protocols when aircraft selected
    useEffect(() => {
        if (!selectedAircraft) { setProtocols([]); return }
        supabase.from('protocols')
            .select('*, aircraft_types(name)')
            .eq('aircraft_type_id', selectedAircraft)
            .then(({ data }) => setProtocols(data || []))
    }, [selectedAircraft])

    // If editing, load existing entry
    useEffect(() => {
        if (!isEdit) return
        loadExistingEntry()
    }, [entryId])

    async function loadExistingEntry() {
        setLoading(true)
        const { data: entry } = await supabase
            .from('log_entries')
            .select('*, protocols(*, aircraft_types(*))')
            .eq('id', entryId)
            .single()

        if (!entry) { navigate('/history'); return }

        const proto = entry.protocols
        setSelectedProtocol(proto)
        setSelectedAircraft(proto.aircraft_type_id)
        setSelectedProtocolType(proto.protocol_type)
        // setEntryDate(entry.date || '')
        // setLocation(entry.location || '')
        // setAcReg(entry.ac_registration || '')

        setEntryDate(entry.date || '')
        setLocation(entry.location || '')
        setAcType(entry.ac_type || '')
        setAcReg(entry.ac_registration || '')
        setRating(entry.rating || '')
        setPrivilege(entry.privilege || '')

        const shouldAutoFill = proto.protocol_type === 'daily' || proto.auto_fill === true
        setAutoFill(shouldAutoFill)
        const { data: taskList } = await supabase
            .from('tasks').select('*').eq('protocol_id', proto.id).order('order')
        setTasks(taskList || [])

        const { data: rowList } = await supabase
            .from('log_entry_rows').select('*').eq('log_entry_id', entryId)

        const initial = {}
        taskList.forEach(t => {
            const r = rowList?.find(r => r.task_id === t.id)
            initial[t.id] = {
                task_type: {
                    FOT: r?.task_type_fot || false,
                    SGH: r?.task_type_sgh || false,
                    'R/I': r?.task_type_ri || false,
                    MEL: r?.task_type_mel || false,
                    TS: r?.task_type_ts || false,
                    MOD: r?.task_type_mod || false,
                    REP: r?.task_type_rep || false,
                    INSP: r?.task_type_insp || false,
                },
                activity: {
                    Training: r?.activity_training || false,
                    Perform: r?.activity_perform || false,
                    Supervise: r?.activity_supervise || false,
                    CRS: r?.activity_crs || false,
                },
                time_duration: r?.time_duration || '',
                remarks: r?.remarks || '',
                row_id: r?.id || null
            }
        })
        setRows(initial)
        setSelectedTasks(new Set(taskList.map(t => t.id)))
        setLoading(false)
        setStep(2)
    }

    async function loadProtocol() {
        const proto = protocols.find(p => p.protocol_type === selectedProtocolType)
        if (!proto) return
        setSelectedProtocol(proto)
        const { data } = await supabase
            .from('tasks').select('*').eq('protocol_id', proto.id).eq('is_active', true).order('order')
        setTasks(data || [])
        setSelectedTasks(new Set(data.map(t => t.id)))
        const initial = {}
        data.forEach(t => {
            initial[t.id] = { task_type: {}, activity: {}, remarks: '' }
        })
        setRows(initial)
        setStep(2)
        // Auto-fill is true for daily by default, or if admin enabled it
        const shouldAutoFill = proto.protocol_type === 'daily' || proto.auto_fill === true
        setAutoFill(shouldAutoFill)
    }

    function updateRow(taskId, field, value) {
        setRows(r => ({ ...r, [taskId]: { ...r[taskId], [field]: value } }))
    }

    function updateCheck(taskId, group, key, val) {
        setRows(r => {
            const updated = {
                ...r,
                [taskId]: { ...r[taskId], [group]: { ...r[taskId][group], [key]: val } }
            }
            // If autoFill and this is the first selected task, copy to all
            const firstTaskId = tasks.find(t => selectedTasks.has(t.id))?.id
            if (autoFill && taskId === firstTaskId) {
                const source = updated[taskId]
                tasks.filter(t => selectedTasks.has(t.id) && t.id !== taskId).forEach(t => {
                    updated[t.id] = {
                        ...updated[t.id],
                        [group]: { ...source[group] }
                    }
                })
            }
            return updated
        })
    }
    function applyToAll(sourceTaskId) {
        const source = rows[sourceTaskId]
        if (!source) return
        const updated = { ...rows }
        tasks.filter(t => selectedTasks.has(t.id)).forEach(t => {
            updated[t.id] = {
                ...rows[t.id],
                task_type: { ...source.task_type },
                activity: { ...source.activity },
            }
        })
        setRows(updated)
    }
    async function handleSave() {
        console.log('handleSave called', { entryDate, location, acType, acReg, rating, privilege })
        setSaving(true)
        setError('')

        try {
            let currentEntryId = entryId

            if (isEdit) {
                const { error: updateErr } = await supabase
                    .from('log_entries')
                    .update({
                        date: entryDate || null,
                        location: location || null,
                        ac_registration: acReg || null,
                        ac_type: acType || null,
                        rating: rating || null,
                        privilege: privilege || null,
                        status: 'draft'
                    })
                    .eq('id', entryId)
                if (updateErr) throw updateErr
            } else {
                const { data: entry, error: entryErr } = await supabase
                    .from('log_entries')
                    .insert({
                        user_id: profile.id,
                        protocol_id: selectedProtocol.id,
                        date: entryDate || null,
                        location: location || null,
                        ac_registration: acReg || null,
                        ac_type: acType || null,
                        rating: rating || null,
                        privilege: privilege || null,
                        status: 'draft'
                    })
                    .select()
                    .single()
                if (entryErr) throw entryErr
                currentEntryId = entry.id
            }

            const selectedTaskList = tasks.filter(t => selectedTasks.has(t.id))
            for (const t of selectedTaskList) {
                const r = rows[t.id] || {}
                const rowData = {
                    log_entry_id: currentEntryId,
                    task_id: t.id,
                    task_type_fot: !!r.task_type?.FOT,
                    task_type_sgh: !!r.task_type?.SGH,
                    task_type_ri: !!r.task_type?.['R/I'],
                    task_type_mel: !!r.task_type?.MEL,
                    task_type_ts: !!r.task_type?.TS,
                    task_type_mod: !!r.task_type?.MOD,
                    task_type_rep: !!r.task_type?.REP,
                    task_type_insp: !!r.task_type?.INSP,
                    activity_training: !!r.activity?.Training,
                    activity_perform: !!r.activity?.Perform,
                    activity_supervise: !!r.activity?.Supervise,
                    activity_crs: !!r.activity?.CRS,
                    remarks: r.remarks || ''
                }
                if (r.row_id) {
                    await supabase.from('log_entry_rows').update(rowData).eq('id', r.row_id)
                } else {
                    await supabase.from('log_entry_rows').insert(rowData)
                }
            }

            navigate('/history')
        } catch (err) {
            console.error('Save error:', err)
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }
    const protocolLabel = v => PROTOCOL_TYPES.find(t => t.value === v)?.label || v

    if (loading) return <div className="loading-msg">Chargement...</div>

    return (
        <div className="logbook-page">
            <div className="logbook-header">
                <h1 className="page-title">
                    {isEdit ? 'Modifier entrée' : 'Nouvelle entrée'} — Carnet d'expérience
                </h1>
                <div className="steps-indicator">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`}>
                            {step > s ? '✓' : s}
                        </div>
                    ))}
                </div>
            </div>

            {/* STEP 1 — Protocol selection */}
            {step === 1 && (
                <div className="step-card">
                    <h2 className="step-title">Étape 1 — Sélection du protocole</h2>
                    <div className="form-row">
                        <div className="field">
                            <label>Type d'appareil</label>
                            <select value={selectedAircraft} onChange={e => { setSelectedAircraft(e.target.value); setSelectedProtocolType('') }}>
                                <option value="">Sélectionner...</option>
                                {aircraft.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="field">
                            <label>Type de protocole</label>
                            <select value={selectedProtocolType} onChange={e => setSelectedProtocolType(e.target.value)} disabled={!selectedAircraft}>
                                <option value="">Sélectionner...</option>
                                {protocols.map(p => (
                                    <option key={p.id} value={p.protocol_type}>{protocolLabel(p.protocol_type)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="step-actions">
                        <button className="btn-primary" onClick={loadProtocol} disabled={!selectedProtocolType}>
                            Continuer →
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2 — Header */}
            {step === 2 && (
                <div className="step-card">
                    <h2 className="step-title">Étape 2 — Sélection des tâches</h2>
                    <div className="protocol-badge">
                        <strong>{selectedProtocol?.aircraft_types?.name}</strong> — {protocolLabel(selectedProtocol?.protocol_type)}
                        &nbsp;·&nbsp; {tasks.length} tâche(s) disponible(s)
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '12px 0 16px' }}>
                        Sélectionnez les tâches que vous avez effectuées :
                    </p>
                    <div className="task-select-list">
                        <div className="task-select-all">
                            <label className="task-select-item" style={{ background: '#f1f5f9' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedTasks.size === tasks.length && tasks.length > 0}
                                    onChange={e => {
                                        if (e.target.checked) setSelectedTasks(new Set(tasks.map(t => t.id)))
                                        else setSelectedTasks(new Set())
                                    }}
                                />
                                <span style={{ fontWeight: 600 }}>Tout sélectionner</span>
                            </label>
                        </div>
                        {tasks.map((t, i) => (
                            <label key={t.id} className={`task-select-item ${selectedTasks.has(t.id) ? 'selected' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedTasks.has(t.id)}
                                    onChange={e => {
                                        const next = new Set(selectedTasks)
                                        if (e.target.checked) next.add(t.id)
                                        else next.delete(t.id)
                                        setSelectedTasks(next)
                                    }}
                                />
                                <div className="task-select-info">
                                    <span className="task-select-ata">{t.ata || '—'}</span>
                                    <span className="task-select-op">{t.operation_performed}</span>
                                    <span className="task-select-dur">{t.time_duration || ''}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="step-actions">
                        {!isEdit && <button className="btn-cancel" onClick={() => setStep(1)}>← Retour</button>}
                        <button
                            className="btn-primary"
                            onClick={() => setStep(3)}
                            disabled={selectedTasks.size === 0}
                        >
                            Continuer ({selectedTasks.size} tâche{selectedTasks.size > 1 ? 's' : ''}) →
                        </button>
                    </div>
                </div>
            )}
            {/* STEP 3 — Tasks */}
            {step === 3 && (
                <div className="step-card wide">
                    <h2 className="step-title">Étape 3 — Tâches</h2>
                    <p className="step-sub">Remplissez les colonnes 1-6 (communes) et 7, 8, 13 par tâche</p>

                    {/* COMMON FIELDS — cols 1-6 apply to all tasks */}
                    <div className="common-fields-box">
                        <h3 className="common-title">Colonnes communes (1–6)</h3>
                        <div className="form-row">
                            <div className="field">
                                <label>1. Date</label>
                                <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>2. Location</label>
                                <SuggestInput
                                    value={location}
                                    onChange={setLocation}
                                    suggestions={suggestions.locations}
                                    placeholder="ex: DAAG"
                                />
                            </div>
                            <div className="field">
                                <label>3. A/C or Comp. Type</label>
                                <SuggestInput
                                    value={acType}
                                    onChange={setAcType}
                                    suggestions={suggestions.acTypes}
                                    placeholder="ex: A330-200"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="field">
                                <label>4. A/C Reg. or Comp. PN/SN</label>
                                <SuggestInput
                                    value={acReg}
                                    onChange={setAcReg}
                                    suggestions={suggestions.acRegs}
                                    placeholder="ex: 7T-VJX"
                                />
                            </div>
                            <div className="field">
                                <label>5. Type of Maintenance (Rating)</label>
                                <SuggestInput
                                    value={rating}
                                    onChange={setRating}
                                    suggestions={suggestions.ratings}
                                    placeholder="ex: B1 LINE"
                                />
                            </div>
                            <div className="field">
                                <label>6. Privilege Used</label>
                                <SuggestInput
                                    value={privilege}
                                    onChange={setPrivilege}
                                    suggestions={suggestions.privileges}
                                    placeholder="ex: B1"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="autofill-hint">
                        💡 Les colonnes 9, 10, 11, 12 sont prédéfinies par l'administrateur. Remplissez uniquement 7, 8 et 13.
                    </div>

                    <div className="tasks-table-wrapper">
                        <table className="tasks-table">
                            <thead>
                                <tr>
                                    <th style={{ background: '#F5E642', color: '#000' }}>9. ATA</th>
                                    <th style={{ background: '#F5E642', color: '#000' }}>10. Opération</th>
                                    <th style={{ background: '#F5E642', color: '#000' }}>11. Durée</th>
                                    <th style={{ background: '#F5E642', color: '#000' }}>12. Réf. document</th>
                                    <th>7. Task Type</th>
                                    <th>8. Activité</th>
                                    <th>13. Remarques</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.filter(t => selectedTasks.has(t.id)).map((t, i) => (
                                    <tr key={t.id} className={i === 0 ? 'first-row' : ''}>
                                        <td className="admin-cell">{t.ata || '—'}</td>
                                        <td className="admin-cell op-cell">{t.operation_performed}</td>
                                        <td className="admin-cell">{t.time_duration || '—'}</td>
                                        <td className="admin-cell ref-cell">{t.maintenance_record_ref || '—'}</td>
                                        <td>
                                            <CheckGroup
                                                options={TASK_TYPES}
                                                values={rows[t.id]?.task_type || {}}
                                                onChange={(k, v) => updateCheck(t.id, 'task_type', k, v)}
                                            />
                                        </td>
                                        <td>
                                            <CheckGroup
                                                options={ACTIVITIES}
                                                values={rows[t.id]?.activity || {}}
                                                onChange={(k, v) => updateCheck(t.id, 'activity', k, v)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className="remarks-input"
                                                value={rows[t.id]?.remarks || ''}
                                                onChange={e => updateRow(t.id, 'remarks', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            {i === 0 && !autoFill && (
                                                <button className="btn-apply-all" onClick={() => applyToAll(t.id)}>
                                                    ↓ Appliquer à tous
                                                </button>
                                            )}
                                            {i === 0 && autoFill && (
                                                <span style={{ fontSize: '10px', color: '#64748b' }}>Auto ✓</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="step-actions">
                        <button className="btn-cancel" onClick={() => setStep(2)}>← Retour</button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Enregistrement...' : '💾 Enregistrer'}
                        </button>
                    </div>
                </div>
            )}


        </div>
    )
}