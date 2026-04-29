import { fmtCAD, fmtNum, fmtPct, fmtSignedPct, Icon, BarChart, useApi } from '../components'

export default function OverviewView({ onJumpTo, registerExport, fyFrom, fyTo, fyQuery }) {
  const { data: overview } = useApi(`/api/overview?${fyQuery}`)
  const { data: trend } = useApi(`/api/topline-trend?${fyQuery}`)
  const { data: cats } = useApi(`/api/category-summaries?${fyQuery}`)

  if (!overview || !trend || !cats) return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading overview…</div>

  const worst = cats.length > 0 ? cats[0] : null
  const latest = trend[trend.length - 1]
  const first = trend[0]
  const cagrTotal = Math.pow(latest.total_spend / first.total_spend, 1 / (trend.length - 1)) - 1
  const cagrUnit = Math.pow(latest.avg_contract_value / first.avg_contract_value, 1 / (trend.length - 1)) - 1
  const cagrCount = Math.pow(latest.contract_count / first.contract_count, 1 / (trend.length - 1)) - 1
  const chartData = trend.map(r => ({ label: `FY${String(r.fiscal_year).slice(2)}`, value: r.total_spend }))
  const top6 = cats.slice(0, 6)
  const maxConcern = Math.max(...top6.map(c => c.concern_score))

  return (
    <div className="tab-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div className="page-eyebrow">Overview · FY{String(fyFrom).slice(2)} → FY{String(fyTo).slice(2)}</div>
        <h1 className="page-title">Federal procurement spend</h1>
      </div>

      {/* Insight banner */}
      {worst && (
        <div className="insight insight-critical">
          <div className="insight-icon"><Icon name="alert" size={18}/></div>
          <div className="insight-text">
            Federal spend grew <b>{fmtSignedPct(cagrTotal)}</b> per year — <b>{((cagrTotal - cagrCount) * 100).toFixed(1)} pts</b> ahead of volume growth.
            The gap is unit-cost inflation. <b>{worst.name}</b> is the top offender: spend up <b>{fmtSignedPct(worst.cagr_spend)}</b> CAGR.
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total spend FY{String(fyTo).slice(2)}</div><div className="kpi-value">{fmtCAD(latest.total_spend)}</div><div className="kpi-meta"><span className="delta-up">▲ {fmtSignedPct(cagrTotal)} CAGR</span></div></div>
        <div className="kpi"><div className="kpi-label">Contracts FY{String(fyTo).slice(2)}</div><div className="kpi-value">{fmtNum(latest.contract_count)}</div><div className="kpi-meta"><span className="delta-up">▲ {fmtSignedPct(cagrCount)} CAGR</span></div></div>
        <div className="kpi kpi-warning"><div className="kpi-label">Avg contract</div><div className="kpi-value">{fmtCAD(latest.avg_contract_value)}</div><div className="kpi-meta"><span className="delta-up">▲ {fmtSignedPct(cagrUnit)} unit-cost</span></div></div>
        <div className="kpi kpi-critical"><div className="kpi-label">Avg amendment</div><div className="kpi-value">{latest.avg_amendment ? `${(latest.avg_amendment * 100).toFixed(0)}%` : '—'}</div><div className="kpi-meta">Amendment ratio</div></div>
      </div>

      <div className="grid-2-1">
        {/* Spend trend */}
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Total spend by fiscal year</div><div className="card-sub">Nominal CAD · all categories</div></div>
          </div>
          <div className="card-body"><BarChart data={chartData} height={200}/></div>
        </div>

        {/* Concern score leaderboard */}
        <div className="card">
          <div className="card-head"><div><div className="card-title">Concern score · top 6</div><div className="card-sub">Unit growth × spend drift</div></div></div>
          <div className="card-body" style={{ padding: '10px 16px 14px' }}>
            {top6.map(c => (
              <div key={c.code} className="bar-row" style={{ gridTemplateColumns: '1fr 1fr 50px' }}>
                <button className="bar-label" style={{ background: 'transparent', textAlign: 'left', border: 'none', cursor: 'pointer' }} onClick={() => onJumpTo('category', c.code)}>{c.name}</button>
                <div className="bar-track" style={{ height: 10 }}>
                  <div className="bar-fill" style={{ width: `${(c.concern_score / maxConcern) * 100}%`, background: c.concern_score > 12 ? 'var(--critical)' : c.concern_score > 7 ? 'var(--warning)' : 'var(--gc-blue)' }}/>
                </div>
                <div className="bar-value">{c.concern_score.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action table */}
      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Where to look first</div><div className="card-sub">Click a row to drill into category</div></div>
          <button className="btn btn-sm btn-ghost" onClick={() => onJumpTo('watchlist')}>Open full watchlist →</button>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Category</th><th className="num">Spend FY{String(fyTo).slice(2)}</th><th className="num">CAGR</th><th className="num">Volume Δ</th><th className="num">Unit Δ</th><th className="num">Concern</th>
          </tr></thead>
          <tbody>
            {top6.map(c => (
              <tr key={c.code} style={{ cursor: 'pointer' }} onClick={() => onJumpTo('category', c.code)}>
                <td><b>{c.name}</b><div className="mono" style={{ marginTop: 2 }}>EOC {c.code}</div></td>
                <td className="num">{fmtCAD(c.latest_spend)}</td>
                <td className="num"><span className="chip chip-critical">{fmtSignedPct(c.cagr_spend)}</span></td>
                <td className="num">{fmtSignedPct(c.cagr_volume)}</td>
                <td className="num">{fmtSignedPct(c.cagr_unit)}</td>
                <td className="num"><b>{c.concern_score.toFixed(1)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
