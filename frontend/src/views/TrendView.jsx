import { useState } from 'react'
import { fmtCAD, fmtNum, fmtPct, Icon, useApi } from '../components'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const PALETTE = ['#0071e3','#5e5ce6','#af52de','#ff9f0a','#1f8a3b','#ff453a']

export default function TrendView() {
  const { data: trend } = useApi('/api/topline-trend')
  const { data: cats } = useApi('/api/category-summaries')
  const [metric, setMetric] = useState('total_spend')

  if (!trend || !cats) return <div style={{padding:40,color:'var(--text-tertiary)'}}>Loading…</div>

  const metricLabel = {total_spend:'Total spend',contract_count:'Contracts',avg_contract_value:'Avg value'}[metric] || metric
  const fmt = metric.includes('spend') || metric.includes('value') ? fmtCAD : fmtNum

  return (
    <div className="tab-fade" style={{display:'flex',flexDirection:'column',gap:22}}>
      <div className="page-head">
        <div className="page-eyebrow">Time-series explorer</div>
        <div className="page-title">Year-over-year, side-by-side</div>
        <div className="page-sub">Compare core metrics across all fiscal years covered by the dataset.</div>
      </div>

      <div className="filter-bar">
        <span className="filter-label">Metric</span>
        <div className="segmented">
          {[['total_spend','Spend'],['contract_count','Volume'],['avg_contract_value','Avg value']].map(([k,l])=>(
            <button key={k} className={metric===k?'on':''} onClick={()=>setMetric(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div><div className="card-title">{metricLabel} · all years</div></div></div>
        <div className="card-body" style={{height:340}}>
          <ResponsiveContainer>
            <LineChart data={trend.map(r=>({...r, label:`FY${String(r.fiscal_year).slice(2)}`}))}>
              <XAxis dataKey="label" tick={{fill:'var(--text-tertiary)',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={fmt} tick={{fill:'var(--text-tertiary)',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip formatter={v=>[fmt(v),metricLabel]} contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--hairline)',borderRadius:10,fontSize:13}}/>
              <Line type="monotone" dataKey={metric} stroke={PALETTE[0]} strokeWidth={2} dot={{r:3,fill:PALETTE[0]}} activeDot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Year-by-year data table */}
      <div className="card">
        <div className="card-head"><div><div className="card-title">Raw data</div></div></div>
        <div className="card-body" style={{padding:0}}>
          <table className="tbl"><thead><tr><th>Year</th><th className="num">Total spend</th><th className="num">Contracts</th><th className="num">Avg value</th><th className="num">Amendment</th></tr></thead>
            <tbody>{trend.map(r=>(
              <tr key={r.fiscal_year}><td>FY{String(r.fiscal_year).slice(2)}</td><td className="num">{fmtCAD(r.total_spend)}</td><td className="num">{fmtNum(r.contract_count)}</td><td className="num">{fmtCAD(r.avg_contract_value)}</td><td className="num">{r.avg_amendment ? `${(r.avg_amendment*100).toFixed(0)}%` : '—'}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
