import { useState } from 'react'
import { fmtCAD, fmtSignedPct, fmtPct, Icon, useApi } from '../components'

export default function VendorView({ onJumpTo }) {
  const { data: cats } = useApi('/api/category-summaries')
  const { data: conc } = useApi('/api/concentration')
  const [sortBy, setSortBy] = useState('spend')

  if (!cats || !conc) return <div style={{padding:40,color:'var(--text-tertiary)'}}>Loading…</div>

  const sorted = [...cats].sort((a,b) => sortBy==='spend' ? (b.latest_spend||0)-(a.latest_spend||0) : (b.concern_score||0)-(a.concern_score||0))

  return (
    <div className="tab-fade" style={{display:'flex',flexDirection:'column',gap:22}}>
      <div className="page-head">
        <div className="page-eyebrow">Vendor concentration · Herfindahl-Hirschman Index</div>
        <div className="page-title">Where the same names keep winning</div>
        <div className="page-sub">HHI is the sum of squared market shares. Below 0.10 = competitive; 0.10-0.18 = moderate; above 0.18 = concentrated.</div>
      </div>

      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Top vendors across all categories</div><div className="card-sub">By total spend</div></div>
        </div>
        <div className="card-body" style={{padding:0}}>
          <table className="tbl"><thead><tr><th>Vendor</th><th className="num">Contracts</th><th className="num">Spend</th><th className="num">Market share</th></tr></thead>
            <tbody>{conc.top_vendors?.slice(0,12).map(v=>(
              <tr key={v.vendor_name}>
                <td style={{fontWeight:500}}>{v.vendor_name}</td>
                <td className="num">{v.contracts}</td>
                <td className="num">{fmtCAD(v.spend)}</td>
                <td className="num">
                  <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end'}}>
                    <div className="cell-bar-wrap" style={{width:70}}><div className="cell-bar" style={{width:`${Math.min(v.market_share_pct,100)}%`,background:v.market_share_pct>10?'var(--critical)':'var(--accent)'}}/></div>
                    <span>{v.market_share_pct}%</span>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Category breakdown</div><div className="card-sub">Click a row to drill into category</div></div>
          <div className="segmented">
            <button className={sortBy==='spend'?'on':''} onClick={()=>setSortBy('spend')}>By spend</button>
            <button className={sortBy==='concern'?'on':''} onClick={()=>setSortBy('concern')}>By concern</button>
          </div>
        </div>
        <div className="card-body" style={{padding:0}}>
          <table className="tbl"><thead><tr><th>Category</th><th className="num">Latest Spend</th><th className="num">Spend CAGR</th><th className="num">Unit CAGR</th><th className="num">Concern</th></tr></thead>
            <tbody>{sorted.map(c=>(
              <tr key={c.code} style={{cursor:'pointer'}} onClick={()=>onJumpTo('category',c.code)}>
                <td><div style={{fontWeight:500}}>{c.name}</div><div className="mono" style={{marginTop:2}}>EOC {c.code}</div></td>
                <td className="num">{fmtCAD(c.latest_spend)}</td>
                <td className="num"><span className={`chip ${(c.cagr_spend||0)>0.08?'chip-critical':'chip-warning'}`}>{fmtSignedPct(c.cagr_spend)}</span></td>
                <td className="num">{fmtSignedPct(c.cagr_unit)}</td>
                <td className="num">{c.concern_score}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
