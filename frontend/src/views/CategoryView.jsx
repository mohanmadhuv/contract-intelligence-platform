import { useState, useEffect } from 'react'
import { fmtCAD, fmtNum, fmtPct, fmtSignedPct, Icon, DecompositionChart, DonutChart, useApi } from '../components'

export default function CategoryView({ initialCode, onJumpTo, registerExport, fyFrom, fyTo, fyQuery }) {
  const { data: cats } = useApi(`/api/category-summaries?${fyQuery}`)
  const [code, setCode] = useState(initialCode || null)

  useEffect(() => { if (initialCode) setCode(initialCode) }, [initialCode])
  useEffect(() => { if (!code && cats && cats.length > 0) setCode(cats[0].code) }, [cats, code])

  const { data: yearRows } = useApi(code ? `/api/category-year-rows?code=${code}&${fyQuery}` : null)
  const { data: vendors } = useApi(code ? `/api/vendor-shares?code=${code}&${fyQuery}` : null)

  if (!cats) return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading…</div>
  const cat = cats.find(c => c.code === code)
  if (!cat) return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Select a category</div>

  const sortedYears = yearRows ? [...yearRows].sort((a, b) => a.year - b.year) : []
  const first = sortedYears[0]
  const decompRows = sortedYears.map((r, i) => {
    if (i === 0 || !first) return { label: `FY${String(r.year).slice(2)}`, volumeContribution: 0, unitContribution: 0, totalSpend: r.spend }
    const volEffect = (r.contracts - first.contracts) * first.avg_value
    const unitEffect = r.contracts * (r.avg_value - first.avg_value)
    return { label: `FY${String(r.year).slice(2)}`, volumeContribution: Math.max(0, volEffect), unitContribution: Math.max(0, unitEffect), totalSpend: r.spend }
  })

  const driver = (cat.cagr_unit || 0) > (cat.cagr_volume || 0) ? 'unit-cost inflation' : 'volume growth'
  const donutSlices = vendors ? vendors.map(v => ({ value: v.share, label: v.vendor })) : []

  return (
    <div className="tab-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div className="page-eyebrow">Category deep-dive · EOC {cat.code}</div>
        <h1 className="page-title">{cat.name}</h1>
      </div>

      <div className="filter-bar">
        <span className="filter-label">Category</span>
        <select value={code} onChange={e => setCode(e.target.value)}>
          {cats.map(c => <option key={c.code} value={c.code}>{c.name} · concern {c.concern_score.toFixed(1)}</option>)}
        </select>
        <div className="spacer"/>
        <span className="chip">{fmtCAD(cat.latest_spend)} FY{String(fyTo).slice(2)}</span>
        <span className={`chip ${(cat.cagr_spend || 0) > 0.10 ? 'chip-critical' : 'chip-warning'}`}>{fmtSignedPct(cat.cagr_spend)} CAGR</span>
      </div>

      {/* Insight */}
      <div className={`insight ${cat.concern_score > 12 ? 'insight-critical' : 'insight-warning'}`}>
        <div className="insight-icon"><Icon name="info" size={18}/></div>
        <div className="insight-text">
          Spend grew <b>{fmtSignedPct(cat.cagr_spend)}</b> per year — driven by <b>{driver}</b>.
          {vendors && vendors.length > 0 && <> Top vendor <b>{vendors[0].vendor}</b> holds <b>{fmtPct(vendors[0].share)}</b>.</>}
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Spend CAGR</div><div className="kpi-value">{fmtSignedPct(cat.cagr_spend)}</div><div className="kpi-meta">FY{String(fyFrom).slice(2)} → FY{String(fyTo).slice(2)}</div></div>
        <div className="kpi"><div className="kpi-label">Volume effect</div><div className="kpi-value">{fmtSignedPct(cat.cagr_volume)}</div><div className="kpi-meta">Contract count</div></div>
        <div className="kpi kpi-warning"><div className="kpi-label">Unit-cost effect</div><div className="kpi-value">{fmtSignedPct(cat.cagr_unit)}</div><div className="kpi-meta">Avg contract value</div></div>
        <div className="kpi kpi-critical"><div className="kpi-label">HHI Δ</div><div className="kpi-value">{(cat.hhi_delta || 0) >= 0 ? '+' : ''}{((cat.hhi_delta || 0) * 100).toFixed(1)}</div><div className="kpi-meta">Concentration drift</div></div>
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-head"><div><div className="card-title">Decomposition · what drove spend growth</div><div className="card-sub">Volume (purple) vs unit-cost (blue) above baseline</div></div></div>
          <div className="card-body"><DecompositionChart rows={decompRows} height={200}/></div>
        </div>
        <div className="card">
          <div className="card-head"><div><div className="card-title">Vendor shares</div><div className="card-sub">HHI {(cat.latest_hhi || 0).toFixed(3)}</div></div></div>
          <div className="card-body" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <DonutChart slices={donutSlices} size={130}/>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {vendors && vendors.slice(0, 5).map((v, i) => (
                <div key={v.vendor} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, background: ['var(--viz-1)','var(--viz-2)','var(--viz-3)','var(--viz-4)','var(--viz-5)'][i] }}/>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.vendor}</span>
                  <b style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtPct(v.share)}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Year-by-year table */}
      {sortedYears.length > 0 && (
        <div className="card">
          <div className="card-head"><div><div className="card-title">Year-by-year</div></div></div>
          <table className="tbl">
            <thead><tr><th>FY</th><th className="num">Spend</th><th className="num">Contracts</th><th className="num">Avg value</th><th className="num">HHI</th><th className="num">Amend.</th></tr></thead>
            <tbody>
              {sortedYears.map(r => (
                <tr key={r.year}>
                  <td><b>FY{String(r.year).slice(2)}</b></td>
                  <td className="num">{fmtCAD(r.spend)}</td>
                  <td className="num">{fmtNum(r.contracts)}</td>
                  <td className="num">{fmtCAD(r.avg_value)}</td>
                  <td className="num">{(r.hhi || 0).toFixed(3)}</td>
                  <td className="num">{r.amendment_ratio ? `${(r.amendment_ratio * 100).toFixed(0)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
