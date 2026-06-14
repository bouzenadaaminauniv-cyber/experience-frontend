import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSetting } from '../hooks/useSettings'
import { supabase } from '../lib/supabase'
import './LogbookPreviewPage.css'
import './CoverPage.css'

const PROTOCOL_LABELS = {
  daily: 'Daily', weekly: 'Weekly',
  line_check: 'Line Check', pre_flight: 'Pre-flight'
}

function chk(val) { return val ? 'X' : '' }

export default function CoverPage() {
  const { profile } = useAuth()
  const { value: logoUrl } = useSetting('logo_url')
  const [entries, setEntries] = useState([])
  const [entryData, setEntryData] = useState({})
  const [standalone, setStandalone] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: entriesList } = await supabase
      .from('log_entries')
      .select('*, protocols(*, aircraft_types(*))')
      .eq('user_id', profile.id)
      .order('date', { ascending: true })

    const { data: standaloneList } = await supabase
      .from('log_entry_rows')
      .select('*')
      .eq('standalone_user_id', profile.id)
      .eq('is_standalone', true)
      .order('standalone_date', { ascending: true })

    const dataMap = {}
    for (const entry of (entriesList || [])) {
      const { data: tasks } = await supabase
        .from('tasks').select('*')
        .eq('protocol_id', entry.protocol_id)
        .neq('is_active', false)
        .order('order')
      const { data: rows } = await supabase
        .from('log_entry_rows').select('*').eq('log_entry_id', entry.id)
      const rowMap = {}
      rows?.forEach(r => { rowMap[r.task_id] = r })
      dataMap[entry.id] = { tasks: tasks || [], rowMap }
    }

    setEntries(entriesList || [])
    setEntryData(dataMap)
    setStandalone(standaloneList || [])
    setLoading(false)
  }

  const logoTag = logoUrl
    ? <img src={logoUrl} alt="Air Algérie" style={{ width: '110px', display: 'block' }} />
    : <div style={{ color: '#CC0000', fontWeight: 'bold', fontSize: '12px' }}>AIR ALGÉRIE</div>

  function PageHeader({ pageNum }) {
    return (
      <table className="doc-table header-table">
        <tbody>
          <tr>
            <td className="header-logo">
              {logoTag}
              <div className="logo-technics">TECHNICS</div>
              <div className="logo-ref">DACM.AMO.01 / EASA.145.0163</div>
            </td>
            <td className="header-title">
              <div className="title-main">MAINTENANCE EXPERIENCE LOGBOOK</div>
              <div className="title-sub">LIVRET D'EXPERIENCE EN MAINTENANCE</div>
            </td>
            <td className="header-ids">
              <div><strong>AHT ID :</strong>&nbsp;{profile?.aht_id || '………………'}</div>
              <div><strong>Page :</strong>&nbsp;{pageNum}</div>
            </td>
          </tr>
        </tbody>
      </table>
    )
  }

  function TaskTable({ tasks, rowMap, entry, standaloneRows }) {
    const ROWS_PER_PAGE = 10
    const aircraft = entry?.ac_type || entry?.protocols?.aircraft_types?.name || ''
    const rating = entry?.rating || entry?.protocols?.rating || ''
    const privilege = entry?.privilege || entry?.protocols?.privilege || ''

    const allRows = tasks ? tasks.map(t => {
      const r = rowMap[t.id] || {}
      return {
        date: entry?.date || '',
        location: entry?.location || '',
        acType: aircraft,
        acReg: entry?.ac_registration || '',
        rating, privilege,
        fot: chk(r.task_type_fot), sgh: chk(r.task_type_sgh),
        ri: chk(r.task_type_ri), mel: chk(r.task_type_mel),
        ts: chk(r.task_type_ts), mod: chk(r.task_type_mod),
        rep: chk(r.task_type_rep), insp: chk(r.task_type_insp),
        training: chk(r.activity_training), perform: chk(r.activity_perform),
        supervise: chk(r.activity_supervise), crs: chk(r.activity_crs),
        ata: t.ata || '', op: t.operation_performed || '',
        dur: t.time_duration || '', ref: t.maintenance_record_ref || '',
        remarks: r.remarks || ''
      }
    }) : (standaloneRows || []).map(r => ({
      date: r.standalone_date || '', location: r.standalone_location || '',
      acType: r.standalone_ac_type || '', acReg: r.standalone_ac_registration || '',
      rating: r.standalone_rating || '', privilege: r.standalone_privilege || '',
      fot: chk(r.task_type_fot), sgh: chk(r.task_type_sgh),
      ri: chk(r.task_type_ri), mel: chk(r.task_type_mel),
      ts: chk(r.task_type_ts), mod: chk(r.task_type_mod),
      rep: chk(r.task_type_rep), insp: chk(r.task_type_insp),
      training: chk(r.activity_training), perform: chk(r.activity_perform),
      supervise: chk(r.activity_supervise), crs: chk(r.activity_crs),
      ata: r.standalone_ata || '', op: r.standalone_operation || '',
      dur: r.time_duration || '', ref: r.standalone_ref || '',
      remarks: r.remarks || ''
    }))

    // Pad to ROWS_PER_PAGE
    while (allRows.length < ROWS_PER_PAGE) allRows.push(null)

    return (
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
            <th colSpan={8}>7.</th><th colSpan={4}>8.</th>
            <th rowSpan={2}>9.</th><th rowSpan={2}>10.</th>
            <th rowSpan={2}>11.</th><th rowSpan={2}>12.</th><th rowSpan={2}>13.</th>
          </tr>
          <tr className="col-num-row">
            <th colSpan={8} style={{ fontSize: '8px' }}>Task Type</th>
            <th colSpan={4} style={{ fontSize: '8px' }}>Type of Activity</th>
          </tr>
          <tr className="col-label-row">
            {['Date','Location','A/C or Comp. Type','A/C Reg. or Comp. PN / SN',
              'Type of Maintenance (Rating)','Privilege Used',
              'FOT','SGH','R/I','MEL','TS','MOD','REP','INSP',
              'Training','Perform','Supervise','CRS',
              'A T A','Operation Performed','Time Duration',
              'Maintenance record Ref.','Remarks']
              .map(l => <th key={l}><span className="col-label">{l}</span></th>)}
          </tr>
        </thead>
        <tbody>
          {allRows.map((r, i) => r ? (
            <tr key={i}>
              <td>{r.date}</td><td>{r.location}</td>
              <td>{r.acType}</td><td>{r.acReg}</td>
              <td>{r.rating}</td><td>{r.privilege}</td>
              <td className="check">{r.fot}</td><td className="check">{r.sgh}</td>
              <td className="check">{r.ri}</td><td className="check">{r.mel}</td>
              <td className="check">{r.ts}</td><td className="check">{r.mod}</td>
              <td className="check">{r.rep}</td><td className="check">{r.insp}</td>
              <td className="check">{r.training}</td><td className="check">{r.perform}</td>
              <td className="check">{r.supervise}</td><td className="check">{r.crs}</td>
              <td>{r.ata}</td><td className="op-cell">{r.op}</td>
              <td>{r.dur}</td><td className="ref-cell">{r.ref}</td>
              <td className="left">{r.remarks}</td>
            </tr>
          ) : (
            <tr key={i} style={{ height: '22px' }}>
              {Array(23).fill(null).map((_, j) => <td key={j}></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  function PageFooter() {
    return (
      <>
        <div className="doc-note">
          <strong>Note :</strong> The tasks recorded need to be related to a combination of activities / authorizations and not limited to simple tasks. &nbsp;/&nbsp;
          <strong>Note :</strong> Les tâches enregistrées doivent être associées à une combinaison d'activités / autorisations et ne se limitent pas à des tâches simples.
        </div>
        <div className="sig-block">
          <div className="sig-row">
            <div className="sig-col">
              <div><strong>Logbook owner's signature (*) :</strong></div>
              <div><em>Signature du détenteur du livret</em></div>
              <div className="sig-fields">
                <span>Date :<br />…………………………….</span>
                <span>Name (Nom) :<br /><strong>{profile?.name} {profile?.surname}</strong></span>
                <span>Signature :<br />…………………………….</span>
              </div>
            </div>
            <div className="sig-col">
              <div><strong>Team Leader / Manager's validation :</strong></div>
              <div><em>Validation du Chef d'Equipe / Responsable</em></div>
              <div className="sig-fields">
                <span>Date :<br />…………………………….</span>
                <span>Name (Nom) :<br />…………………………….</span>
                <span>Signature :<br />…………………………….</span>
              </div>
            </div>
          </div>
        </div>
        <div className="doc-declaration">
          <em>(*) I declare that the entries in this logbook are complete and true. / Je <u>déclare</u> que les <u>enregistrements</u> de ce <u>livret</u> sont <u>complets</u> et <u>vrais</u>.</em>
        </div>
        <div className="doc-footer-ref">
          <span>AHDT - 101</span>
          <span>- Sept. 2018 -</span>
        </div>
      </>
    )
  }

  if (loading) return <div style={{ padding: 40 }}>Chargement...</div>

  // Build pages
  const ROWS_PER_PAGE = 10
  const pages = []
  let pageNum = 2

  // Entry pages — split by ROWS_PER_PAGE
  for (const entry of entries) {
    const { tasks, rowMap } = entryData[entry.id] || { tasks: [], rowMap: {} }
    const chunks = []
    for (let i = 0; i < Math.max(tasks.length, 1); i += ROWS_PER_PAGE) {
      chunks.push(tasks.slice(i, i + ROWS_PER_PAGE))
    }
    for (const chunk of chunks) {
      pages.push({ type: 'entry', entry, tasks: chunk, rowMap, pageNum: pageNum++ })
    }
  }

  // Standalone pages
  const standaloneChunks = []
  for (let i = 0; i < standalone.length; i += ROWS_PER_PAGE) {
    standaloneChunks.push(standalone.slice(i, i + ROWS_PER_PAGE))
  }
  for (const chunk of standaloneChunks) {
    pages.push({ type: 'standalone', standaloneRows: chunk, pageNum: pageNum++ })
  }

  return (
    <div className="preview-page">
      <div className="preview-toolbar">
        <span className="preview-title">Mon Carnet — {profile?.name} {profile?.surname}</span>
        <button
          className="btn-primary"
          style={{ background: '#dc2626' }}
          onClick={() => window.open(`http://localhost:3001/api/export/carnet/${profile?.id}/pdf`, '_blank')}
        >
          ⬇ Exporter tout le carnet (PDF)
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>

        {/* COVER PAGE */}
        <div className="logbook-doc">
          <PageHeader pageNum={1} />
          <div className="personnel-title">
            <strong>PERSONNEL DATA</strong><br />
            <em>INFORMATION SUR LA PERSONNE</em>
          </div>
          <table className="doc-table personnel-table">
            <tbody>
              <tr>
                <td className="pers-label"><strong>Name</strong><br /><em>Nom</em></td>
                <td className="pers-value">{profile?.surname || ''}</td>
              </tr>
              <tr>
                <td className="pers-label"><strong><u>Surname</u></strong><br /><em>Prénom</em></td>
                <td className="pers-value">{profile?.name || ''}</td>
              </tr>
              <tr>
                <td className="pers-label">
                  <strong>Date &amp; place of <u>birth</u></strong><br />
                  <em>Date et lieu de naissance</em>
                </td>
                <td className="pers-value">
                  {profile?.date_of_birth || ''}{profile?.place_of_birth ? ` — ${profile.place_of_birth}` : ''}
                </td>
              </tr>
              <tr>
                <td className="pers-label">
                  <strong>Authorization Nr</strong><br />
                  <em><u>Numéro d'habilitation</u></em><br />
                  <em>(if already hold)</em>
                </td>
                <td className="pers-value">{profile?.authorization_nr || ''}</td>
              </tr>
              <tr>
                <td className="pers-label">
                  <strong>Scope of <u>autorization</u></strong><br />
                  <em>Domaine d'habilitation</em>
                </td>
                <td className="pers-value">{profile?.scope_of_authorization || ''}</td>
              </tr>
              <tr>
                <td className="pers-label"><strong>Signature</strong><br /><em>Signature</em></td>
                <td className="pers-value" style={{ height: '50px' }}></td>
              </tr>
            </tbody>
          </table>
          <div className="doc-footer-ref">
            <span>AHDT - 101</span>
            <span>- Sept. 2018 -</span>
          </div>
        </div>

        {/* ENTRY PAGES */}
        {pages.map((p, i) => (
          <div key={i} className="logbook-doc">
            <PageHeader pageNum={p.pageNum} />
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
            <TaskTable
              tasks={p.type === 'entry' ? p.tasks : null}
              rowMap={p.rowMap}
              entry={p.entry}
              standaloneRows={p.type === 'standalone' ? p.standaloneRows : null}
            />
            <PageFooter />
          </div>
        ))}

        {pages.length === 0 && (
          <div className="logbook-doc" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <p style={{ fontSize: '15px' }}>Aucune entrée dans votre carnet.</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Créez des entrées pour les voir apparaître ici.</p>
          </div>
        )}
      </div>
    </div>
  )
}