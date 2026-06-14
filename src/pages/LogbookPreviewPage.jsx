import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './LogbookPreviewPage.css'
import { useSetting } from '../hooks/useSettings'

const PROTOCOL_LABELS = {
    daily: 'Daily', weekly: 'Weekly',
    line_check: 'Line Check', pre_flight: 'Pre-flight'
}

function chk(val) { return val ? 'X' : '' }



export default function LogbookPreviewPage() {
    const { entryId } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const { value: logoUrl } = useSetting('logo_url')

    useEffect(() => { loadData() }, [entryId])

    async function loadData() {
        const { data: entry } = await supabase
            .from('log_entries')
            .select('*, protocols(*, aircraft_types(*))')
            .eq('id', entryId).single()
        const { data: tasks } = await supabase
            .from('tasks').select('*').eq('protocol_id', entry.protocol_id).order('order')
        const { data: rows } = await supabase
            .from('log_entry_rows').select('*').eq('log_entry_id', entryId)
        const { data: user } = await supabase
            .from('users').select('*').eq('id', entry.user_id).single()
        const rowMap = {}
        rows?.forEach(r => { rowMap[r.task_id] = r })
        setData({ entry, protocol: entry.protocols, tasks: tasks || [], rowMap, user })
        setLoading(false)
    }

    if (loading) return <div style={{ padding: 40 }}>Chargement...</div>

    const { entry, protocol, tasks, rowMap, user } = data
    const aircraft = protocol?.aircraft_types?.name || ''

    return (
        <div className="preview-page">
            <div className="preview-toolbar">
                <button className="btn-cancel" onClick={() => navigate(-1)}>← Retour</button>
                <span className="preview-title">Aperçu — {aircraft} {PROTOCOL_LABELS[protocol?.protocol_type]}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-primary" style={{ background: '#dc2626' }}
                        onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/export/entry/${entryId}/pdf`, '_blank')}>
                        ⬇ PDF
                    </button>
                    <button className="btn-primary"
                        onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/export/entry/${entryId}`, '_blank')}>
                        ⬇ Word
                    </button>
                </div>
            </div>

            <div className="logbook-doc">

                {/* HEADER */}
                <table className="doc-table header-table">
                    <tbody>
                        <tr>
                            <td className="header-logo">
                                {logoUrl && (
                                    <img
                                        src={logoUrl}
                                        alt="Air Algérie"
                                        style={{ width: '110px', display: 'block' }}
                                    />
                                )}
                                <div className="logo-technics">TECHNICS</div>
                                <div className="logo-ref">DACM.AMO.01 / EASA.145.0163</div>
                            </td>
                            <td className="header-title">
                                <div className="title-main">MAINTENANCE EXPERIENCE LOGBOOK</div>
                                <div className="title-sub">LIVRET D'EXPERIENCE EN MAINTENANCE</div>
                            </td>
                            <td className="header-ids">
                                <div><strong>AHT ID :</strong>&nbsp;{user?.aht_id || '………………'}</div>
                                <div><strong>Page :</strong>&nbsp;………………</div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* RECORDS BANNER */}
                <div className="records-banner">
                    <div className="records-note-left">
                        <em>This logbook is intended to be hand written or filled electronically.<br />Add / print pages as needed.</em>
                    </div>
                    <div className="records-center">
                        <strong>RECORDS</strong>
                        <em>ENREGISTREMENTS</em>
                    </div>
                    <div className="records-note-right">
                        <em>Ce livret est destiné à être renseigné à la main ou rempli électroniquement.<br />Ajouter / imprimer les pages au besoin.</em>
                    </div>
                </div>

                {/* MAIN TABLE */}
                <table className="doc-table main-table">
                    <colgroup>
                        <col className="c-date" /><col className="c-loc" />
                        <col className="c-actype" /><col className="c-acreg" />
                        <col className="c-rating" /><col className="c-priv" />
                        <col className="c-tt" /><col className="c-tt" /><col className="c-tt" /><col className="c-tt" />
                        <col className="c-tt" /><col className="c-tt" /><col className="c-tt" /><col className="c-tt" />
                        <col className="c-act" /><col className="c-act" /><col className="c-act" /><col className="c-act" />
                        <col className="c-ata" /><col className="c-op" />
                        <col className="c-dur" /><col className="c-ref" /><col className="c-rem" />
                    </colgroup>
                    <thead>
                        <tr className="col-num-row">
                            <th rowSpan={2}>1.</th><th rowSpan={2}>2.</th>
                            <th rowSpan={2}>3.</th><th rowSpan={2}>4.</th>
                            <th rowSpan={2}>5.</th><th rowSpan={2}>6.</th>
                            <th colSpan={8}>7.</th>
                            <th colSpan={4}>8.</th>
                            <th rowSpan={2}>9.</th><th rowSpan={2}>10.</th>
                            <th rowSpan={2}>11.</th><th rowSpan={2}>12.</th><th rowSpan={2}>13.</th>
                        </tr>
                        <tr className="col-num-row">
                            <th colSpan={8} style={{ fontSize: '9px' }}>Task Type</th>
                            <th colSpan={4} style={{ fontSize: '9px' }}>Type of Activity</th>
                        </tr>
                        <tr className="col-label-row">
                            {[
                                'Date', 'Location', 'A/C or Comp. Type', 'A/C Reg. or Comp. PN / SN',
                                'Type of Maintenance (Rating)', 'Privilege Used',
                                'FOT', 'SGH', 'R/I', 'MEL', 'TS', 'MOD', 'REP', 'INSP',
                                'Training', 'Perform', 'Supervise', 'CRS',
                                'A T A', 'Operation Performed', 'Time Duration',
                                'Maintenance record Ref.', 'Remarks'
                            ].map(l => <th key={l}><span className="col-label">{l}</span></th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(t => {
                            const r = rowMap[t.id] || {}
                            return (
                                <tr key={t.id}>
                                    <td>{entry.date}</td>
                                    <td>{entry.location}</td>
                                    <td>{entry.ac_type}</td>
                                    <td>{entry.ac_registration}</td>
                                    <td>{entry.rating}</td>
                                    <td>{entry.privilege}</td>
                                    <td>{aircraft}</td>
                                    <td className="check">{chk(r.task_type_fot)}</td>
                                    <td className="check">{chk(r.task_type_sgh)}</td>
                                    <td className="check">{chk(r.task_type_ri)}</td>
                                    <td className="check">{chk(r.task_type_mel)}</td>
                                    <td className="check">{chk(r.task_type_ts)}</td>
                                    <td className="check">{chk(r.task_type_mod)}</td>
                                    <td className="check">{chk(r.task_type_rep)}</td>
                                    <td className="check">{chk(r.task_type_insp)}</td>
                                    <td className="check">{chk(r.activity_training)}</td>
                                    <td className="check">{chk(r.activity_perform)}</td>
                                    <td className="check">{chk(r.activity_supervise)}</td>
                                    <td className="check">{chk(r.activity_crs)}</td>
                                    <td>{t.ata}</td>
                                    <td>{t.ata}</td>
                                    <td className="op-cell">{t.operation_performed}</td>
                                    <td>{t.time_duration}</td>
                                    <td className="ref-cell">{t.maintenance_record_ref}</td>
                                    <td className="left">{r.remarks}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {/* NOTE — plain centered text */}
                <div className="doc-note">
                    <strong>Note :</strong> The tasks recorded need to be related to a combination of activities / authorizations and not limited to simple tasks. &nbsp;/&nbsp;
                    <strong>Note :</strong> Les tâches enregistrées doivent être associées à une combinaison d'activités / autorisations et ne se limitent pas à des tâches simples.
                </div>

                {/* SIGNATURE BLOCK */}
                <div className="sig-block">
                    <div className="sig-row">
                        <div className="sig-col">
                            <div><strong>Logbook owner's signature (*) :</strong></div>
                            <div><em>Signature du détenteur du livret</em></div>
                            <div className="sig-fields">
                                <span>Date :<br />……………………………..</span>
                                <span>Name (Nom) :<br />……………………………..</span>
                                <span>Signature :<br />……………………………..</span>
                            </div>
                        </div>
                        <div className="sig-col">
                            <div><strong>Team Leader / Manager's validation :</strong></div>
                            <div><em>Validation du Chef d'Equipe / Responsable</em></div>
                            <div className="sig-fields">
                                <span>Date :<br />……………………………..</span>
                                <span>Name (Nom) :<br />……………………………..</span>
                                <span>Signature :<br />……………………………..</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DECLARATION */}
                <div className="doc-declaration">
                    <em>(*) I declare that the entries in this logbook are complete and true. / Je <u>déclare</u> que les <u>enregistrements</u> de ce <u>livret</u> sont <u>complets</u> et <u>vrais</u>.</em>
                </div>

                {/* FOOTER REF — LEFT */}
                <div className="doc-footer-ref">
                    <span>AHDT - 101</span>
                    <span>- Sept. 2018 -</span>
                </div>

            </div>
        </div>
    )
}