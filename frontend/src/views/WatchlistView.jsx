import { fmtCAD, fmtSignedPct, Icon, useApi } from '../components'

export default function WatchlistView({ onJumpTo }) {
  const { data: watchlist } = useApi('/api/watchlist')
  const { data: lfm } = useApi('/api/less-for-more')

  if (!watchlist || !lfm) return <div style={{padding:40,color:'var(--text-tertiary)'}}>Loading…</div>

  return (
    <div className="tab-fade" style={{display:'flex',flexDirection:'column',gap:22}}>
      <div className="page-head">
        <div className="page-eyebrow">Less for more · combined signals</div>
        <div className="page-title">Where taxpayers are getting less for more</div>
        <div className="page-sub">Contracts flagged when high amendment ratios collide with fast unit-cost growth.</div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Flagged contracts</div><div className="card-sub">High amendment × concerning category</div></div>
            <span className="chip chip-critical">{watchlist.length} active</span>
          </div>
          <div>
            {watchlist.slice(0,15).map(c => {
              const flag = c.amendment_ratio > 1.6 ? 'critical' : 'warning'
              return (
                <div key={c.reference_number} className="watch-row">
                  <div className={`flag-stripe flag-${flag}`}/>
                  <div>
                    <div className="watch-title">{c.title}</div>
                    <div className="watch-meta">
                      <span>{c.vendor}</span><span>·</span>
                      <span className="mono">{c.reference_number}</span><span>·</span>
                      <span>FY{String(c.fiscal_year).slice(2)}</span>
                    </div>
                  </div>
                  <div className="watch-stat">
                    <div className="watch-stat-val">{c.amendment_ratio}×</div>
                    <div className="watch-stat-lbl">{fmtCAD(c.original_value)} → {fmtCAD(c.total_value)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card">
            <div className="card-head"><div><div className="card-title">Value erosion ranking</div><div className="card-sub">Categories by erosion score</div></div></div>
            <div className="card-body" style={{padding:0}}>
              <table className="tbl"><thead><tr><th>Category</th><th className="num">Spend growth</th><th className="num">Unit cost Δ</th><th className="num">Sole-source %</th><th className="num">Score</th></tr></thead>
                <tbody>{lfm.slice(0,8).map(r=>(
                  <tr key={r.category}>
                    <td style={{fontWeight:500}}>{r.category_label}</td>
                    <td className="num">{r.spend_growth_pct>0?'+':''}{r.spend_growth_pct}%</td>
                    <td className="num">{r.unit_cost_growth_pct>0?'+':''}{r.unit_cost_growth_pct}%</td>
                    <td className="num">{r.sole_source_pct != null ? `${Number(r.sole_source_pct).toFixed(0)}%` : '—'}</td>
                    <td className="num"><span className={`chip ${r.erosion_score>40?'chip-critical':r.erosion_score>20?'chip-warning':'chip-positive'}`}>{r.erosion_score}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>

          <div className="narrative">
            <div className="narrative-head"><span className="narrative-mark">AI</span>Insight</div>
            <div className="narrative-body">The watchlist is dominated by categories where unit costs are rising faster than volume — meaning taxpayers are buying the same amount but paying more per unit. High amendment ratios indicate scope creep and post-award cost overruns that bypass competitive procurement controls.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
