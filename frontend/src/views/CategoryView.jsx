import { useState, useEffect } from 'react'
import { fmtCAD, fmtNum, fmtSignedPct, fmtPct, Icon, useApi } from '../components'

export default function CategoryView({ initialCode, onJumpTo }) {
  const { data: cats } = useApi('/api/category-summaries')
  const [code, setCode] = useState(initialCode || null)

  useEffect(() => { if (initialCode) setCode(initialCode) }, [initialCode])
  useEffect(() => { if (cats && !code) setCode(cats[0]?.code) }, [cats, code])

  // Use economic_object_code for spend-trend by passing as eoc param
  const { data: yearRows } = useApi(code ? `/api/spend-trend?year_from=2015&year_to=2025` : null)
  const { data: concentration } = useApi(`/api/concentration`)

  if (!cats || !code) return <div style={{padding:40,color:'var(--text-tertiary)'}}>Loading…</div>
  const cat = cats.find(c => c.code === code) || cats[0]

  return (
    <div className="tab-fade" style={{display:'flex',flexDirection:'column',gap:22}}>
      <div className="page-head">
        <div className="page-eyebrow">Category deep-dive · EOC {cat.code}</div>
        <div className="page-title">{cat.name}</div>
        <div className="page-sub">Decomposing what drove the {fmtSignedPct(cat.cagr_spend)} annual spend growth.</div>
      </div>

      <div className="filter-bar">
        <span className="filter-label">Category</span>
        <select value={code} onChange={e=>setCode(e.target.value)} className="btn" style={{padding:'5px 10px'}}>
          {cats.map(c=><option key={c.code} value={c.code}>{c.name} · concern {c.concern_score}</option>)}
        </select>
        <div className="spacer"/>
        <span className="chip">{fmtCAD(cat.latest_spend)} latest</span>
        <span className={`chip ${(cat.cagr_spend||0)>0.10?'chip-critical':'chip-warning'}`}>{fmtSignedPct(cat.cagr_spend)} CAGR</span>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Spend growth</div><div className="kpi-value">{fmtSignedPct(cat.cagr_spend)}</div><div className="kpi-meta"><span className="text-tert">CAGR</span></div></div>
        <div className="kpi"><div className="kpi-label">Volume effect</div><div className="kpi-value">{fmtSignedPct(cat.cagr_volume)}</div><div className="kpi-meta"><span className="text-tert">Contract count CAGR</span></div></div>
        <div className="kpi"><div className="kpi-label">Unit-cost effect</div><div className="kpi-value">{fmtSignedPct(cat.cagr_unit)}</div><div className="kpi-meta"><span className="text-tert">Avg value CAGR</span></div></div>
        <div className="kpi"><div className="kpi-label">Contracts</div><div className="kpi-value">{fmtNum(cat.latest_count||0)}</div><div className="kpi-meta"><span className="text-tert">Latest year</span></div></div>
      </div>

      <div className="grid-2">
        {/* Year-by-year table — uses topline trend since we can't filter by EOC via spend-trend */}
        <div className="card">
          <div className="card-head"><div><div className="card-title">Year-by-year (all categories)</div><div className="card-sub">Spend, contracts, average value</div></div></div>
          <div className="card-body" style={{padding:0}}>
            {yearRows && yearRows.length > 0 ? (
              <table className="tbl"><thead><tr><th>Year</th><th className="num">Spend</th><th className="num">Contracts</th><th className="num">Avg value</th><th className="num">YoY</th></tr></thead>
                <tbody>{yearRows.map(r=>(
                  <tr key={r.year}><td>FY{String(r.year).slice(2)}</td><td className="num">{fmtCAD(r.spend)}</td><td className="num">{fmtNum(r.contracts)}</td><td className="num">{fmtCAD(r.avg_value)}</td><td className="num">{r.yoy_growth_pct!=null?`${r.yoy_growth_pct>0?'+':''}${r.yoy_growth_pct}%`:'—'}</td></tr>
                ))}</tbody>
              </table>
            ) : <div style={{padding:20,color:'var(--text-tertiary)'}}>Loading year data…</div>}
          </div>
        </div>

        {/* Vendor concentration */}
        <div className="card">
          <div className="card-head"><div><div className="card-title">Top vendors (all categories)</div><div className="card-sub">By market share</div></div></div>
          <div className="card-body" style={{padding:'10px 18px'}}>
            {concentration?.top_vendors ? concentration.top_vendors.slice(0,8).map((v,i) => (
              <div key={v.vendor_name} className="bar-row">
                <div className="bar-label">{v.vendor_name}</div>
                <div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(v.market_share_pct,100)}%`,background:['var(--viz-1)','var(--viz-2)','var(--viz-3)','var(--viz-4)','var(--viz-5)'][i%5]}}/></div>
                <div className="bar-value">{v.market_share_pct}%</div>
              </div>
            )) : <div style={{padding:20,color:'var(--text-tertiary)'}}>Loading vendors…</div>}
          </div>
        </div>
      </div>

      {/* HHI trend */}
      {concentration?.hhi_trend && (
        <div className="card">
          <div className="card-head"><div><div className="card-title">HHI concentration trend</div><div className="card-sub">Below 0.10 = competitive · above 0.18 = concentrated</div></div></div>
          <div className="card-body" style={{padding:0}}>
            <table className="tbl"><thead><tr><th>Year</th><th className="num">HHI</th><th className="num">Vendors</th><th>Status</th></tr></thead>
              <tbody>{concentration.hhi_trend.map(h=>(
                <tr key={h.year}><td>FY{String(h.year).slice(2)}</td><td className="num">{h.hhi}</td><td className="num">{h.vendor_count}</td>
                  <td><span className={`chip ${h.hhi>0.18?'chip-critical':h.hhi>0.10?'chip-warning':'chip-positive'}`}>{h.hhi>0.18?'Concentrated':h.hhi>0.10?'Moderate':'Competitive'}</span></td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
