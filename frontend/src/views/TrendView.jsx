import { useState } from 'react'
import { fmtCAD, fmtNum, Icon, Sparkline, useApi } from '../components'

const METRICS = [
  { key: 'total_spend',  label: 'Total spend',         fmt: fmtCAD },
  { key: 'contract_count', label: 'Contract volume',    fmt: fmtNum },
  { key: 'avg_contract_value', label: 'Avg contract value', fmt: fmtCAD },
  { key: 'avg_amendment', label: 'Amendment ratio',     fmt: v => `${(v*100).toFixed(0)}%` },
]

const COLORS = ['var(--viz-1)','var(--viz-2)','var(--viz-3)','var(--viz-4)','var(--viz-5)','var(--viz-6)']

export default function TrendView({ onJumpTo, registerExport, fyFrom, fyTo, fyQuery }) {
  const { data: trend } = useApi(`/api/topline-trend?${fyQuery}`)
  const { data: cats } = useApi(`/api/category-summaries?${fyQuery}`)
  const [metric, setMetric] = useState('total_spend')
  const metricObj = METRICS.find(m => m.key === metric) || METRICS[0]

  if (!trend) return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading…</div>

  const sparkData = trend.map(r => ({ label: `FY${String(r.fiscal_year).slice(2)}`, value: r[metric] || 0 }))
  const first = trend[0]
  const last = trend[trend.length - 1]
  const change = first && last && first[metric] ? ((last[metric] - first[metric]) / first[metric]) : 0

  return (
    <div className="tab-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div className="page-eyebrow">Time-series analysis</div>
        <h1 className="page-title">Trends over time</h1>
      </div>

      <div className="filter-bar">
        <span className="filter-label">Metric</span>
        <div className="segmented">
          {METRICS.map(m => (
            <button key={m.key} className={metric === m.key ? 'on' : ''} onClick={() => setMetric(m.key)}>{m.label}</button>
          ))}
        </div>
        <div className="spacer"/>
        <span className="chip">{(change * 100).toFixed(1)}% total change</span>
      </div>

      {/* Main trend chart */}
      <div className="card">
        <div className="card-head">
          <div><div className="card-title">{metricObj.label} · FY{String(fyFrom).slice(2)} → FY{String(fyTo).slice(2)}</div></div>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{last ? metricObj.fmt(last[metric] || 0) : '—'}</span>
          </div>
        </div>
        <div className="card-body" style={{ padding: '8px 16px 16px' }}>
          <Sparkline data={sparkData} width={600} height={180} accent="var(--gc-blue)" showDots/>
        </div>
      </div>

      {/* Year-by-year table */}
      <div className="card">
        <div className="card-head"><div><div className="card-title">Year-by-year</div></div></div>
        <table className="tbl">
          <thead><tr>
            <th>Fiscal Year</th>
            <th className="num">Total Spend</th>
            <th className="num">Contracts</th>
            <th className="num">Avg Value</th>
            <th className="num">Amendment %</th>
          </tr></thead>
          <tbody>
            {trend.map(r => (
              <tr key={r.fiscal_year}>
                <td><b>FY{String(r.fiscal_year).slice(2)}</b></td>
                <td className="num">{fmtCAD(r.total_spend)}</td>
                <td className="num">{fmtNum(r.contract_count)}</td>
                <td className="num">{fmtCAD(r.avg_contract_value)}</td>
                <td className="num">{r.avg_amendment ? `${(r.avg_amendment * 100).toFixed(0)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category comparison sparklines */}
      {cats && cats.length > 0 && (
        <div className="card">
          <div className="card-head"><div><div className="card-title">Category comparison</div><div className="card-sub">Click to drill into category</div></div></div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {cats.slice(0, 6).map((c, i) => (
              <div key={c.code} style={{ cursor: 'pointer', padding: 10, borderRadius: 'var(--radius)', border: '1px solid var(--hairline)' }}
                   onClick={() => onJumpTo('category', c.code)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <b style={{ fontSize: 13 }}>{c.name}</b>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>EOC {c.code}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>Spend: {fmtCAD(c.latest_spend)}</span>
                  <span>CAGR: {((c.cagr_spend || 0) * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
