import { useState, useEffect, useRef } from 'react'

// ── Formatters ──
export const fmtCAD = (n) => {
  if (n == null || isNaN(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) return `$${(n/1e9).toFixed(2)}B`
  if (abs >= 1e6) return `$${(n/1e6).toFixed(1)}M`
  if (abs >= 1e3) return `$${(n/1e3).toFixed(0)}K`
  return new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n)
}
export const fmtNum = (n) => new Intl.NumberFormat('en-CA').format(Math.round(n))
export const fmtPct = (n, d=1) => `${(n*100).toFixed(d)}%`
export const fmtSignedPct = (n, d=1) => `${n>=0?'+':''}${(n*100).toFixed(d)}%`

// ── Icon (inline SVG) ──
export function Icon({ name, size = 16 }) {
  const p = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:1.6, strokeLinecap:'round', strokeLinejoin:'round' }
  const icons = {
    overview: <><rect x="3" y="3" width="7" height="9" rx="1.4"/><rect x="14" y="3" width="7" height="5" rx="1.4"/><rect x="14" y="12" width="7" height="9" rx="1.4"/><rect x="3" y="16" width="7" height="5" rx="1.4"/></>,
    category: <><path d="M3 7h18M3 12h18M3 17h18"/></>,
    vendor: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18z"/></>,
    contracts: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
    watch: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3.5"/></>,
    trend: <><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></>,
    map: <><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></>,
    alert: <><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.01"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></>,
    download: <><path d="M12 4v12M6 12l6 6 6-6M4 20h16"/></>,
    filter: <><path d="M4 5h16l-6 8v6l-4-2v-4z"/></>,
    'arrow-up': <><path d="M12 19V5M5 12l7-7 7 7"/></>,
    'arrow-down': <><path d="M12 5v14M5 12l7 7 7-7"/></>,
  }
  return <svg {...p}>{icons[name] || null}</svg>
}

// ── CountUp (numeric ticker) ──
export function CountUp({ value, formatter = (v) => Math.round(v).toLocaleString(), duration = 700 }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf
    const tick = (now) => {
      const t = Math.min(1, (now-start)/duration)
      setV((1-Math.pow(1-t,3)) * value)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return formatter(v)
}

// ── Sparkline ──
export function Sparkline({ data, width=220, height=56, accent='var(--accent)', showDots=false, valueKey='value', labelKey='label' }) {
  const ref = useRef(null)
  const [hover, setHover] = useState(null)
  if (!data || data.length < 2) return null
  const ys = data.map(d => d[valueKey])
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const pX = 4, pY = 6
  const x = i => pX + (i/(data.length-1))*(width-pX*2)
  const y = v => height-pY-((v-minY)/Math.max(1e-9,(maxY-minY)))*(height-pY*2)
  const path = data.map((d,i) => `${i===0?'M':'L'}${x(i).toFixed(1)},${y(d[valueKey]).toFixed(1)}`).join(' ')
  const area = `${path} L${x(data.length-1).toFixed(1)},${height-pY} L${x(0).toFixed(1)},${height-pY} Z`
  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const px = e.clientX - rect.left
    const idx = Math.max(0, Math.min(data.length-1, Math.round((px-pX)/((width-pX*2)/(data.length-1)))))
    setHover({ idx, x: x(idx), y: y(data[idx][valueKey]) })
  }
  const gid = `sg-${accent.replace(/\W/g,'')}`
  return (
    <div ref={ref} style={{position:'relative',width:'100%'}} onMouseLeave={()=>setHover(null)} onMouseMove={handleMove}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{width:'100%',height,display:'block'}} preserveAspectRatio="none">
        <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.18"/><stop offset="100%" stopColor={accent} stopOpacity="0"/></linearGradient></defs>
        <path d={area} fill={`url(#${gid})`}/>
        <path d={path} fill="none" stroke={accent} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
        {showDots && data.map((d,i)=><circle key={i} cx={x(i)} cy={y(d[valueKey])} r="2" fill={accent}/>)}
        {hover && <>
          <line x1={hover.x} x2={hover.x} y1={pY} y2={height-pY} stroke="var(--hairline-strong)" strokeWidth="1" strokeDasharray="2 2"/>
          <circle cx={hover.x} cy={hover.y} r="3.2" fill={accent} stroke="var(--bg-elevated)" strokeWidth="1.5"/>
        </>}
      </svg>
      {hover && <div className="tooltip" style={{left:`${(hover.x/width)*100}%`,top:hover.y}}>
        <b>{data[hover.idx][labelKey]}</b> · {typeof data[hover.idx][valueKey]==='number' && data[hover.idx][valueKey]>1000 ? fmtCAD(data[hover.idx][valueKey]) : data[hover.idx][valueKey]}
      </div>}
    </div>
  )
}

// ── useApi hook ──
export function useApi(path) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const API = import.meta.env.VITE_API_URL || ''
  useEffect(() => {
    setLoading(true)
    fetch(`${API}${path}`).then(r=>r.json()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false))
  }, [path, API])
  return { data, loading }
}
