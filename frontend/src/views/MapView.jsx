import { useState } from 'react'
import { fmtCAD, Icon, useApi } from '../components'

const PROV_RECTS = {
  YT:{x:30,y:60,w:60,h:60}, NT:{x:95,y:60,w:80,h:60}, NU:{x:180,y:30,w:90,h:90},
  BC:{x:30,y:125,w:70,h:80}, AB:{x:105,y:130,w:55,h:75}, SK:{x:165,y:130,w:50,h:75},
  MB:{x:220,y:130,w:55,h:75}, ON:{x:280,y:145,w:80,h:65}, QC:{x:365,y:90,w:80,h:100},
  NB:{x:410,y:195,w:32,h:30}, NS:{x:445,y:200,w:38,h:28}, PE:{x:445,y:185,w:18,h:12}, NL:{x:450,y:90,w:55,h:90},
}

export default function MapView() {
  const { data: depts } = useApi('/api/departments')
  const [hover, setHover] = useState(null)

  if (!depts) return <div style={{padding:40,color:'var(--text-tertiary)'}}>Loading…</div>

  return (
    <div className="tab-fade" style={{display:'flex',flexDirection:'column',gap:22}}>
      <div className="page-head">
        <div className="page-eyebrow">Geography · spend by department</div>
        <div className="page-title">Where the dollars land</div>
        <div className="page-sub">Spend distributed by awarding department. Ontario and Quebec dominate by virtue of headquarters concentration.</div>
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-head"><div><div className="card-title">Regional distribution (stylized)</div><div className="card-sub">Hover provinces</div></div></div>
          <div className="card-body" style={{position:'relative'}}>
            <svg viewBox="0 0 540 240" style={{width:'100%',display:'block'}}>
              {Object.entries(PROV_RECTS).map(([code, rect]) => {
                const isHi = hover === code
                return (
                  <g key={code} onMouseEnter={()=>setHover(code)} onMouseLeave={()=>setHover(null)}>
                    <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx="4"
                      fill={isHi ? 'var(--accent)' : 'var(--bg-inset)'}
                      stroke={isHi ? 'var(--text)' : 'var(--hairline-strong)'}
                      strokeWidth={isHi ? 1.5 : 0.8}
                      style={{transition:'fill 200ms ease',cursor:'pointer'}}/>
                    <text x={rect.x+rect.w/2} y={rect.y+rect.h/2+4} textAnchor="middle" fontSize="11" fontWeight="600"
                      fill={isHi ? 'white' : 'var(--text-tertiary)'} style={{pointerEvents:'none'}}>{code}</text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><div className="card-title">By department</div><div className="card-sub">Top spending organizations</div></div></div>
          <div className="card-body" style={{padding:'10px 18px 16px'}}>
            {depts.slice(0,10).map(d => {
              const max = depts[0].spend
              return (
                <div key={d.code} className="bar-row">
                  <div className="bar-label" title={d.name}><span className="mono-tag" style={{marginRight:8}}>{d.code}</span>{d.name}</div>
                  <div className="bar-track"><div className="bar-fill" style={{width:`${(d.spend/max)*100}%`}}/></div>
                  <div className="bar-value">{fmtCAD(d.spend)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
