import { fmtCAD, fmtNum, fmtPct, Icon, useApi } from '../components'

export default function WatchlistView({ onJumpTo, registerExport, fyFrom, fyTo, fyQuery }) {
  const { data: watchlist } = useApi(`/api/watchlist?${fyQuery}`)
  const { data: lessMore } = useApi(`/api/less-for-more?${fyQuery}`)

  if (!watchlist || !lessMore) return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading…</div>

  return (
    <div className="tab-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div className="page-eyebrow">Less for more · watchlist</div>
        <h1 className="page-title">Value erosion monitor</h1>
      </div>

      {/* Insight */}
      <div className="insight insight-critical">
        <div className="insight-icon"><Icon name="alert" size={18}/></div>
        <div className="insight-text">
          <b>{watchlist.length}</b> contracts have amendment ratios above 115% — the total value exceeds the original by significant margins.
          {lessMore.length > 0 && <> Category <b>{lessMore[0].category_label || lessMore[0].category}</b> has the highest erosion score of <b>{lessMore[0].erosion_score}</b>.</>}
        </div>
      </div>

      <div className="grid-2">
        {/* Flagged contracts */}
        <div className="card">
          <div className="card-head"><div><div className="card-title">Flagged contracts</div><div className="card-sub">Amendment ratio {'>'}115%</div></div></div>
          <div className="card-body" style={{ maxHeight: 400, overflowY: 'auto', padding: 0 }}>
            {watchlist.map((w, i) => (
              <div key={i} className="watch-row">
                <div className={`flag-stripe ${w.amendment_ratio > 2 ? 'flag-critical' : 'flag-warning'}`}/>
                <div>
                  <div className="watch-title">{w.vendor}</div>
                  <div className="watch-meta">
                    <span>FY{String(w.fiscal_year).slice(2)}</span>
                    <span>·</span>
                    <span>{w.title}</span>
                  </div>
                  <div className="watch-meta">
                    <span>Original: {fmtCAD(w.original_value)}</span>
                    <span>→</span>
                    <span>Final: {fmtCAD(w.total_value)}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="watch-stat-val">{(w.amendment_ratio * 100).toFixed(0)}%</div>
                  <div className="watch-stat-lbl">Amendment</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Watch categories */}
        <div className="card">
          <div className="card-head"><div><div className="card-title">Erosion by category</div><div className="card-sub">Composite risk score</div></div></div>
          <table className="tbl">
            <thead><tr><th>Category</th><th className="num">Spend growth</th><th className="num">Unit-cost Δ</th><th className="num">Sole source</th><th className="num">Score</th></tr></thead>
            <tbody>
              {lessMore.slice(0, 12).map(r => (
                <tr key={r.category} style={{ cursor: 'pointer' }} onClick={() => onJumpTo('category', r.category)}>
                  <td><b>{r.category_label || r.category}</b></td>
                  <td className="num">{r.spend_growth_pct != null ? `${r.spend_growth_pct}%` : '—'}</td>
                  <td className="num">{r.unit_cost_growth_pct != null ? `${r.unit_cost_growth_pct}%` : '—'}</td>
                  <td className="num">{r.sole_source_pct != null ? `${r.sole_source_pct}%` : '—'}</td>
                  <td className="num"><span className={`chip ${r.erosion_score > 40 ? 'chip-critical' : r.erosion_score > 20 ? 'chip-warning' : ''}`}>{r.erosion_score}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
