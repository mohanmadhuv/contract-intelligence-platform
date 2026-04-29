import { fmtCAD, fmtNum, fmtPct, Icon, Sparkline, useApi } from '../components'

export default function VendorView({ onJumpTo, registerExport, fyFrom, fyTo, fyQuery }) {
  const { data: conc } = useApi(`/api/concentration?${fyQuery}`)

  if (!conc) return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading…</div>

  const { top_vendors: topV = [], hhi_trend: hhiT = [] } = conc
  const latestHHI = hhiT.length > 0 ? hhiT[hhiT.length - 1].hhi : 0
  const hhiLabel = latestHHI > 0.25 ? 'Highly concentrated' : latestHHI > 0.15 ? 'Moderately concentrated' : 'Competitive'
  const hhiColor = latestHHI > 0.25 ? 'var(--critical)' : latestHHI > 0.15 ? 'var(--warning)' : 'var(--positive)'
  const topShare = topV.length > 0 ? topV[0].market_share_pct : 0
  const concentratedCount = topV.filter(v => v.market_share_pct > 10).length
  const hhiSparkData = hhiT.map(r => ({ label: `FY${String(r.year).slice(2)}`, value: r.hhi * 100 }))

  return (
    <div className="tab-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div className="page-eyebrow">Vendor concentration · all categories</div>
        <h1 className="page-title">Market power analysis</h1>
      </div>

      {/* Insight */}
      <div className={`insight ${latestHHI > 0.15 ? 'insight-warning' : ''}`}>
        <div className="insight-icon"><Icon name="info" size={18}/></div>
        <div className="insight-text">
          Overall market is <b style={{ color: hhiColor }}>{hhiLabel}</b> (HHI {(latestHHI * 100).toFixed(1)}).
          {topV.length > 0 && <> The largest vendor, <b>{topV[0].vendor_name}</b>, holds <b>{topShare.toFixed(1)}%</b>.</>}
          {concentratedCount > 3 && <> {concentratedCount} vendors hold {'>'}10% market share — potential supply-chain risk.</>}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">HHI (latest year)</div><div className="kpi-value">{(latestHHI * 100).toFixed(1)}</div><div className="kpi-meta" style={{ color: hhiColor }}>{hhiLabel}</div></div>
        <div className="kpi"><div className="kpi-label">Unique vendors</div><div className="kpi-value">{hhiT.length > 0 ? fmtNum(hhiT[hhiT.length - 1].vendor_count) : '—'}</div><div className="kpi-meta">In latest FY</div></div>
        <div className="kpi kpi-warning"><div className="kpi-label">{'>'}10% share</div><div className="kpi-value">{concentratedCount}</div><div className="kpi-meta">Concentrated vendors</div></div>
        <div className="kpi"><div className="kpi-label">Largest share</div><div className="kpi-value">{topShare.toFixed(1)}%</div><div className="kpi-meta">{topV.length > 0 ? topV[0].vendor_name : ''}</div></div>
      </div>

      <div className="grid-2">
        {/* HHI Trend */}
        <div className="card">
          <div className="card-head"><div><div className="card-title">HHI trend</div><div className="card-sub">Higher = more concentrated</div></div></div>
          <div className="card-body">
            {hhiSparkData.length >= 2 ? (
              <Sparkline data={hhiSparkData} width={400} height={120} accent="var(--warning)" showDots/>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Not enough years for a trend chart.</div>
            )}
          </div>
        </div>

        {/* Top vendors */}
        <div className="card">
          <div className="card-head"><div><div className="card-title">Top vendors</div><div className="card-sub">By total spend</div></div></div>
          <div className="card-body" style={{ padding: '10px 16px' }}>
            {topV.slice(0, 8).map(v => (
              <div key={v.vendor_name} className="bar-row">
                <div className="bar-label" title={v.vendor_name}>{v.vendor_name}</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${v.market_share_pct}%` }}/></div>
                <div className="bar-value">{v.market_share_pct.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full vendor table */}
      <div className="card">
        <div className="card-head"><div><div className="card-title">Vendor detail</div></div></div>
        <table className="tbl">
          <thead><tr><th>#</th><th>Vendor</th><th className="num">Spend</th><th className="num">Contracts</th><th className="num">Market share</th><th>Risk</th></tr></thead>
          <tbody>
            {topV.map((v, i) => (
              <tr key={v.vendor_name}>
                <td>{i + 1}</td>
                <td><b>{v.vendor_name}</b></td>
                <td className="num">{fmtCAD(v.spend)}</td>
                <td className="num">{fmtNum(v.contracts)}</td>
                <td className="num">{v.market_share_pct.toFixed(1)}%</td>
                <td><span className={`chip ${v.market_share_pct > 15 ? 'chip-critical' : v.market_share_pct > 5 ? 'chip-warning' : ''}`}>
                  {v.market_share_pct > 15 ? 'High' : v.market_share_pct > 5 ? 'Medium' : 'Low'}
                </span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
