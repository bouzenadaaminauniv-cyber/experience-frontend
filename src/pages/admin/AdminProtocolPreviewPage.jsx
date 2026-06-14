import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import '../LogbookPreviewPage.css'

function check() { return '☐' }

export default function AdminProtocolPreviewPage() {
  const { protocolId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [protocolId])

  async function loadData() {
    const { data: protocol } = await supabase
      .from('protocols')
      .select('*, aircraft_types(*)')
      .eq('id', protocolId)
      .single()

    const { data: tasks } = await supabase
      .from('tasks').select('*').eq('protocol_id', protocolId).order('order')

    setData({ protocol, tasks: tasks || [] })
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 40 }}>Chargement...</div>

  const { protocol, tasks } = data
  const aircraft = protocol?.aircraft_types?.name || ''
  const PROTOCOL_LABELS = {
    daily: 'Daily', weekly: 'Weekly',
    line_check: 'Line Check', pre_flight: 'Pre-flight'
  }

  return (
    <div className="preview-page">
      <div className="preview-toolbar">
        <button className="btn-cancel" onClick={() => window.close()}>✕ Fermer</button>
        <span className="preview-title">
          Aperçu Protocole — {aircraft} {PROTOCOL_LABELS[protocol?.protocol_type]}
        </span>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          {tasks.length} tâche(s) · Rating: {protocol?.rating} · Privilege: {protocol?.privilege}
        </span>
      </div>

      <div className="logbook-doc">
        {/* HEADER */}
        <table className="doc-table header-table">
          <tbody>
            <tr>
              <td className="header-logo">
                <div className="logo-box">
                  <div className="logo-airline">الخطوط الجوية الجزائرية</div>
                  <div className="logo-air">AIR ALGÉRIE</div>
                  <div className="logo-technics">TECHNICS</div>
                  <div className="logo-ref">DACM.AMO.01 / EASA.145.0163</div>
                </div>
              </td>
              <td className="header-title">
                <div className="title-main">MAINTENANCE EXPERIENCE LOGBOOK</div>
                <div className="title-sub">LIVRET D'EXPERIENCE EN MAINTENANCE</div>
              </td>
              <td className="header-ids">
                <div><strong>AHT ID :</strong> ………………</div>
                <div><strong>Page :</strong> ………………</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* RECORDS NOTE */}
        <div className="records-banner">
          <div className="records-note-left">
            <em>This logbook is intended to be hand written or filled electronically.</em><br />
            <em>Add / print pages as needed.</em>
          </div>
          <div className="records-center">
            <strong>RECORDS</strong><br />
            <em>ENREGISTREMENTS</em>
          </div>
          <div className="records-note-right">
            <em>Ce livret est destiné à être renseigné à la main ou rempli électroniquement.</em><br />
            <em>Ajouter / imprimer les pages au besoin.</em>
          </div>
        </div>

        {/* MAIN TABLE */}
        <table className="doc-table main-table">
          <thead>
            <tr className="col-numbers">
              <th rowSpan={2}>1.<br /><span className="col-label">Date</span></th>
              <th rowSpan={2}>2.<br /><span className="col-label">Location</span></th>
              <th rowSpan={2}>3.<br /><span className="col-label">A/C or Comp. Type</span></th>
              <th rowSpan={2}>4.<br /><span className="col-label">A/C Reg. or Comp. PN/SN</span></th>
              <th rowSpan={2}>5.<br /><span className="col-label">Type of Maintenance (Rating)</span></th>
              <th rowSpan={2}>6.<br /><span className="col-label">Privilege Used</span></th>
              <th colSpan={8}>7.<br /><span className="col-label">Task Type</span></th>
              <th colSpan={4}>8.<br /><span className="col-label">Type of Activity</span></th>
              <th rowSpan={2}>9.<br /><span className="col-label">ATA</span></th>
              <th rowSpan={2}>10.<br /><span className="col-label">Operation Performed</span></th>
              <th rowSpan={2}>11.<br /><span className="col-label">Time Duration</span></th>
              <th rowSpan={2}>12.<br /><span className="col-label">Maintenance record Ref.</span></th>
              <th rowSpan={2}>13.<br /><span className="col-label">Remarks</span></th>
            </tr>
            <tr className="col-sub">
              {['FOT','SGH','R/I','MEL','TS','MOD','REP','INSP'].map(t => <th key={t}>{t}</th>)}
              {['Training','Perform','Supervise','CRS'].map(a => <th key={a}>{a}</th>)}
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id}>
                <td className="empty-cell"></td>
                <td className="empty-cell"></td>
                <td>{aircraft}</td>
                <td className="empty-cell"></td>
                <td>{protocol?.rating}</td>
                <td>{protocol?.privilege}</td>
                {Array(8).fill(null).map((_, i) => (
                  <td key={i} className="check">{check()}</td>
                ))}
                {Array(4).fill(null).map((_, i) => (
                  <td key={i} className="check">{check()}</td>
                ))}
                <td>{t.ata}</td>
                <td className="op-cell">{t.operation_performed}</td>
                <td className="empty-cell"></td>
                <td className="ref-cell">{t.maintenance_record_ref}</td>
                <td className="empty-cell"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* NOTE */}
        <table className="doc-table note-table">
          <tbody>
            <tr>
              <td className="note-cell">
                <em><strong>Note :</strong> The tasks recorded need to be related to a combination of activities / authorizations and not limited to simple tasks.</em>
              </td>
              <td className="note-sep">/</td>
              <td className="note-cell">
                <em><strong>Note :</strong> Les tâches enregistrées doivent être associées à une combinaison d'activités / autorisations et ne se limitent pas à des tâches simples.</em>
              </td>
            </tr>
          </tbody>
        </table>

        {/* FOOTER */}
        <table className="doc-table footer-table">
          <tbody>
            <tr>
              <td><strong>Record period (dd/mm/yyyy)</strong><br /><em>Période d'enregistrement</em></td>
              <td><strong>From</strong><br /><em>Du</em></td>
              <td>………………</td>
              <td><strong>To</strong><br /><em>Au</em></td>
              <td>………………</td>
              <td><strong>Number of recorded days</strong><br />……………… <em>days</em></td>
            </tr>
          </tbody>
        </table>

        {/* SIGNATURE */}
        <table className="doc-table sig-table">
          <tbody>
            <tr>
              <td>
                <strong>Logbook owner's signature (*) :</strong><br />
                <em>Signature du détenteur du livret</em><br /><br />
                Date : ………………………<br />
                Name (Nom) : ………………………<br />
                Signature : ………………………
              </td>
              <td>
                <strong>Team Leader / Manager's validation :</strong><br />
                <em>Validation du Chef d'Equipe / Responsable</em><br /><br />
                Date : ………………………<br />
                Name (Nom) : ………………………<br />
                Signature : ………………………
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="declaration">
                <em>(*) I declare that the entries in this logbook are complete and true. / Je <u>déclare</u> que les <u>enregistrements</u> de ce <u>livret</u> sont <u>complets</u> et <u>vrais</u>.</em>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="doc-footer-ref">AHDT - 101 &nbsp;&nbsp;&nbsp; - Sept. 2018 -</div>
      </div>
    </div>
  )
}