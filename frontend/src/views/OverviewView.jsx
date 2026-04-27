import { useState, useEffect } from 'react'
import { fmtCAD, fmtNum, fmtSignedPct, fmtPct, Icon, CountUp, Sparkline, useApi } from '../components'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function OverviewView({ onJumpTo }) {
  const { data: overview } = useApi('/api/overview')
  const { data: trend } = useApi('/api/topline-trend')
  const { data: cats } = useApi('/api/category-summaries')
  const { data: lfm } = useApi('/api/less-for-more')

  if (!overview || !trend || !cats) return <div style={{padding:40,color:'var(--text-tertiary)'}}>Loading overview…</div>

  const worst = cats[0]
  const latest = trend[trend.length-1]
  const first = trend[0]
  const cagrTotal = Math.pow(latest.total_spend/first.total_spend, 1/(trend.length-1))-1
  const cagrCount = Math.pow(latest.contract_count/first.contract_count, 1/(trend.length-1))-1
  const cagrUnit = Math.pow(latest.avg_contract_value/first.avg_contract_value, 1/(trend.length-1))-1

  const chartData = trend.map(r => ({ label: `FY${String(r.fiscal_year).slice(2)}`, value: r.total_spend }))
  const top6 = cats.slice(0,6)
  const maxConcern = Math.max(...top6.map(c=>c.concern_score))

  return (
    <div className="tab-fade" style={{display:'flex',flexDirection:'column',gap:22}}>
      <div className="page-head">
        <div className="page-eyebrow">Fiscal year {first.fiscal_year} → {latest.fiscal_year} · {fmtNum(overview.total_contracts)}+ contracts surfaced</div>
        <div className="page-title">What is Canada actually buying — and is it paying more?</div>
        <div className="page-sub">A 10-year decomposition of federal procurement spend across categories, vendors, and amendments.</div>
      </div>

      {/* Hero card */}
      {worst && (
        <div className="hero-card">
          <div>
            <div className="hero-eyebrow"><Icon name="alert" size={14}/> Worst offender · concern score {worst.concern_score}</div>
            <div className="hero-title">{worst.name}</div>
            <div className="hero-sub">Spend grew at <b>{fmtSignedPct(worst.cagr_spend)}</b> CAGR. Unit cost rose {fmtSignedPct(worst.cagr_unit)} annually while volume grew only {fmtSignedPct(worst.cagr_volume)}.</div>
            <div className="hero-stats">
              <div><div className="hero-stat-label">Latest spend</div><div className="hero-stat-value">{fmtCAD(worst.latest_spend)}</div></div>
              <div><div className="hero-stat-label">Avg contract</div><div className="hero-stat-value">{fmtCAD(worst.latest_avg)}</div></div>
              <div><div className="hero-stat-label">Spend CAGR</div><div className="hero-stat-value">{fmtSignedPct(worst.cagr_spend)}</div></div>
              <div><div className="hero-stat-label">Unit CAGR</div><div className="hero-stat-value">{fmtSignedPct(worst.cagr_unit)}</div></div>
            </div>
            <div style={{marginTop:22,display:'flex',gap:8}}>
              <button className="btn btn-primary" onClick={()=>onJumpTo('category',worst.code)}>Open deep-dive</button>
              <button className="btn" onClick={()=>onJumpTo('watchlist')}>See full watchlist</button>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',justifyContent:'center'}}>
            <div className="card" style={{padding:16}}>
              <div style={{fontSize:11.5,color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'0.04em',fontWeight:600}}>Spend trajectory</div>
              <div style={{marginTop:8}}>
                <Sparkline data={chartData} accent="var(--critical)" height={70} showDots/>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total federal spend</div>
          <div className="kpi-value"><CountUp value={latest.total_spend/1e9} formatter={v=>`$${v.toFixed(2)}B`}/></div>
          <div className="kpi-meta"><span className={cagrTotal>0?'delta-up':'delta-down'}>{fmtSignedPct(cagrTotal)} CAGR</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Contracts awarded</div>
          <div className="kpi-value"><CountUp value={latest.contract_count} formatter={v=>fmtNum(v)}/></div>
          <div className="kpi-meta"><span className={cagrCount>0?'delta-up':'delta-down'}>{fmtSignedPct(cagrCount)} CAGR</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Avg contract value</div>
          <div className="kpi-value"><CountUp value={latest.avg_contract_value/1e6} formatter={v=>`$${v.toFixed(2)}M`}/></div>
          <div className="kpi-meta"><span className={cagrUnit>0?'delta-up':'delta-down'}>{fmtSignedPct(cagrUnit)} CAGR</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Avg amendment ratio</div>
          <div className="kpi-value"><CountUp value={(latest.avg_amendment||1)*100} formatter={v=>`${v.toFixed(0)}%`}/></div>
          <div className="kpi-meta"><span className="text-tert">contract inflation</span></div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2-1">
        <div className="card">
          <div className="card-head"><div><div className="card-title">Total spend by fiscal year</div><div className="card-sub">All categories · nominal CAD</div></div></div>
          <div className="card-body" style={{height:240}}>
            <ResponsiveContainer>
              <BarChart data={chartData}><XAxis dataKey="label" tick={{fill:'var(--text-tertiary)',fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>fmtCAD(v)} tick={{fill:'var(--text-tertiary)',fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip formatter={v=>[fmtCAD(v),'Spend']} contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--hairline)',borderRadius:10}}/>
                <Bar dataKey="value" fill="var(--accent)" radius={[3,3,0,0]} barSize={24}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div><div className="card-title">Concern score · top 6</div><div className="card-sub">Weighted: unit growth × concentration</div></div></div>
          <div className="card-body" style={{padding:'10px 18px 16px'}}>
            {top6.map(c=>(
              <div key={c.code} className="bar-row" style={{gridTemplateColumns:'1fr 1fr 60px'}}>
                <button className="bar-label" style={{background:'transparent',textAlign:'left'}} onClick={()=>onJumpTo('category',c.code)}>{c.name}</button>
                <div className="bar-track" style={{height:10}}><div className="bar-fill" style={{width:`${(c.concern_score/maxConcern)*100}%`,background:c.concern_score>12?'var(--critical)':c.concern_score>7?'var(--warning)':'var(--accent)'}}/></div>
                <div className="bar-value">{c.concern_score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fastest growing table */}
      <div className="card">
        <div className="card-head"><div><div className="card-title">Fastest-growing categories</div><div className="card-sub">By spend CAGR</div></div></div>
        <div className="card-body" style={{padding:0}}>
          <table className="tbl"><thead><tr><th>Category</th><th className="num">Latest Spend</th><th className="num">CAGR</th><th className="num">Volume Δ</th><th className="num">Unit Δ</th></tr></thead>
            <tbody>{[...cats].sort((a,b)=>(b.cagr_spend||0)-(a.cagr_spend||0)).slice(0,6).map(c=>(
              <tr key={c.code} style={{cursor:'pointer'}} onClick={()=>onJumpTo('category',c.code)}>
                <td><div style={{fontWeight:500}}>{c.name}</div><div className="mono" style={{marginTop:2}}>EOC {c.code}</div></td>
                <td className="num">{fmtCAD(c.latest_spend)}</td>
                <td className="num"><span className="chip chip-critical">{fmtSignedPct(c.cagr_spend)}</span></td>
                <td className="num">{fmtSignedPct(c.cagr_volume)}</td>
                <td className="num">{fmtSignedPct(c.cagr_unit)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
