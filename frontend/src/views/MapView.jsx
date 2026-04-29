import { fmtCAD, fmtNum, fmtPct, Icon, useApi } from '../components'
import CanadaMap from '../components/CanadaMap'

export default function MapView({ onJumpTo, registerExport, fyFrom, fyTo, fyQuery }) {
  const { data: geo } = useApi(`/api/geography?${fyQuery}`)
  const { data: depts } = useApi(`/api/departments?${fyQuery}`)

  if (!geo) return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading…</div>

  const totalSpend = geo.reduce((s, r) => s + r.spend, 0)
  const totalContracts = geo.reduce((s, r) => s + r.contracts, 0)
  const topProv = geo[0]

  return (
    <div className="tab-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div className="page-eyebrow">Geography · regional analysis</div>
        <h1 className="page-title">Spending by province / territory</h1>
      </div>

      {/* Insight */}
      {topProv && (
        <div className="insight">
          <div className="insight-icon"><Icon name="map" size={18}/></div>
          <div className="insight-text">
            <b>{topProv.name}</b> accounts for <b>{fmtPct(topProv.spend / totalSpend)}</b> of all procurement spend ({fmtCAD(topProv.spend)}).
            The top 3 provinces hold <b>{fmtPct(geo.slice(0, 3).reduce((s, r) => s + r.spend, 0) / totalSpend)}</b> of all spending.
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total mapped spend</div><div className="kpi-value">{fmtCAD(totalSpend)}</div></div>
        <div className="kpi"><div className="kpi-label">Total contracts</div><div className="kpi-value">{fmtNum(totalContracts)}</div></div>
        <div className="kpi"><div className="kpi-label">Provinces/territories</div><div className="kpi-value">{geo.length}</div></div>
        <div className="kpi kpi-warning"><div className="kpi-label">Top province share</div><div className="kpi-value">{topProv ? fmtPct(topProv.spend / totalSpend) : '—'}</div><div className="kpi-meta">{topProv ? topProv.name : ''}</div></div>
      </div>

      <div className="grid-2">
        {/* Map */}
        <div className="card">
          <div className="card-head"><div><div className="card-title">Spend heat map</div><div className="card-sub">Hover for details · darker = higher spend</div></div></div>
          <div className="card-body">
            <CanadaMap data={geo} totalSpend={totalSpend}/>
          </div>
        </div>

        {/* Province ranking */}
        <div className="card">
          <div className="card-head"><div><div className="card-title">Provincial ranking</div><div className="card-sub">By total spend</div></div></div>
          <div className="card-body" style={{ padding: '8px 16px' }}>
            {geo.map(r => (
              <div key={r.code} className="bar-row">
                <div className="bar-label"><b>{r.code}</b> {r.name}</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(r.spend / geo[0].spend) * 100}%` }}/></div>
                <div className="bar-value">{fmtCAD(r.spend)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department spend */}
      {depts && depts.length > 0 && (
        <div className="card">
          <div className="card-head"><div><div className="card-title">Top departments by spend</div></div></div>
          <table className="tbl">
            <thead><tr><th>#</th><th>Department</th><th className="num">Spend</th><th className="num">Share</th><th>Bar</th></tr></thead>
            <tbody>
              {depts.map((d, i) => (
                <tr key={d.code}>
                  <td>{i + 1}</td>
                  <td><b>{d.name}</b><div className="mono" style={{ marginTop: 2, fontSize: 11 }}>{d.code}</div></td>
                  <td className="num">{fmtCAD(d.spend)}</td>
                  <td className="num">{fmtPct(d.spend / totalSpend)}</td>
                  <td style={{ minWidth: 100 }}><div className="cell-bar-wrap"><div className="cell-bar" style={{ width: `${(d.spend / depts[0].spend) * 100}%` }}/></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
