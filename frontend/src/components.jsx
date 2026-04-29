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
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v5"/></>,
    chat: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"/></>,
    close: <><path d="M18 6L6 18M6 6l12 12"/></>,
    send: <><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></>,
  }
  return <svg {...p}>{icons[name] || null}</svg>
}

// ── useApi hook ──
export function useApi(path) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  // Use backend URL directly - Vite env vars must be set at build time
  const API = 'https://contract-intelligence-platform-mm1o.onrender.com'
  useEffect(() => {
    if (!path) { setLoading(false); return }
    setLoading(true)
    fetch(`${API}${path}`).then(r=>r.json()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false))
  }, [path, API])
  return { data, loading }
}

// ── Sparkline ──
export function Sparkline({ data, width=220, height=56, accent='var(--gc-blue)', showDots=false, valueKey='value', labelKey='label' }) {
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

// ── BarChart (GoC styled) ──
export function BarChart({ data, height = 200, formatter = fmtCAD }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.value))
  const barW = Math.min(36, Math.max(12, (600 - data.length * 4) / data.length))
  const totalW = data.length * (barW + 4) + 60
  return (
    <svg viewBox={`0 0 ${totalW} ${height}`} style={{ width: '100%', height, display: 'block' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const yy = 12 + t * (height - 36)
        const v = max * (1 - t)
        return (<g key={t}><line x1={52} x2={totalW - 8} y1={yy} y2={yy} stroke="var(--hairline)" strokeWidth="1"/>
          <text x={48} y={yy + 4} fontSize="10" textAnchor="end" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">{formatter(v)}</text></g>)
      })}
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 40)
        const xx = 56 + i * (barW + 4)
        return (<g key={i}>
          <rect x={xx} y={height - 24 - barH} width={barW} height={barH} fill="var(--gc-blue)" rx="1"/>
          <text x={xx + barW / 2} y={height - 10} fontSize="10" textAnchor="middle" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">{d.label}</text>
        </g>)
      })}
    </svg>
  )
}

// ── DonutChart ──
export function DonutChart({ slices, size = 130 }) {
  if (!slices || slices.length === 0) return null
  const colors = ['var(--viz-1)','var(--viz-2)','var(--viz-3)','var(--viz-4)','var(--viz-5)','var(--viz-6)']
  const cx = size / 2, cy = size / 2, r = size * 0.38, innerR = size * 0.22
  let cumAngle = -Math.PI / 2
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((sl, i) => {
        const angle = (sl.value / total) * Math.PI * 2
        const x1 = cx + r * Math.cos(cumAngle)
        const y1 = cy + r * Math.sin(cumAngle)
        const x2 = cx + r * Math.cos(cumAngle + angle)
        const y2 = cy + r * Math.sin(cumAngle + angle)
        const ix1 = cx + innerR * Math.cos(cumAngle + angle)
        const iy1 = cy + innerR * Math.sin(cumAngle + angle)
        const ix2 = cx + innerR * Math.cos(cumAngle)
        const iy2 = cy + innerR * Math.sin(cumAngle)
        const largeArc = angle > Math.PI ? 1 : 0
        const d = `M${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} L${ix1},${iy1} A${innerR},${innerR} 0 ${largeArc},0 ${ix2},${iy2} Z`
        cumAngle += angle
        return <path key={i} d={d} fill={colors[i % colors.length]}/>
      })}
    </svg>
  )
}

// ── DecompositionChart ──
export function DecompositionChart({ rows, height = 200 }) {
  if (!rows || rows.length < 2) return null
  const maxV = Math.max(...rows.map(r => (r.volumeContribution || 0) + (r.unitContribution || 0)), 1)
  const barW = Math.min(36, Math.max(12, (600 - rows.length * 4) / rows.length))
  const totalW = rows.length * (barW + 4) + 60
  return (
    <svg viewBox={`0 0 ${totalW} ${height}`} style={{ width: '100%', height, display: 'block' }}>
      {rows.map((r, i) => {
        const volH = ((r.volumeContribution || 0) / maxV) * (height - 40)
        const unitH = ((r.unitContribution || 0) / maxV) * (height - 40)
        const xx = 56 + i * (barW + 4)
        const base = height - 24
        return (<g key={i}>
          <rect x={xx} y={base - volH} width={barW} height={volH} fill="var(--viz-2)" rx="1"/>
          <rect x={xx} y={base - volH - unitH} width={barW} height={unitH} fill="var(--viz-1)" rx="1"/>
          <text x={xx + barW / 2} y={height - 10} fontSize="10" textAnchor="middle" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">{r.label}</text>
        </g>)
      })}
    </svg>
  )
}

// ── Export helpers ──
export function buildReportHTML(reportTitle, reports) {
  const today = new Date().toISOString().slice(0, 10)
  const css = `body{font-family:"Lato","Helvetica Neue",Arial,sans-serif;color:#333;margin:40px;font-size:12px;line-height:1.5;}
h1{font-size:22px;border-bottom:3px solid #af3c43;padding-bottom:8px;margin:0 0 4px;}
h2{font-size:16px;color:#284162;margin:24px 0 8px;border-bottom:1px solid #cdcdcd;padding-bottom:4px;}
h3{font-size:13px;color:#284162;margin:14px 0 6px;}
.meta{color:#6f6f6f;font-size:11px;margin-bottom:8px;}
table{border-collapse:collapse;width:100%;margin-bottom:10px;font-size:11px;}
th{background:#284162;color:white;text-align:left;padding:6px 8px;font-weight:700;}
td{padding:5px 8px;border-bottom:1px solid #e5e5e5;}
tr:nth-child(even) td{background:#f8f8f8;}
.kv{display:grid;grid-template-columns:200px 1fr;gap:4px 14px;font-size:12px;margin-bottom:8px;}
.kv .k{color:#555;font-weight:600;} .kv .v{font-variant-numeric:tabular-nums;}
.footer{margin-top:30px;border-top:2px solid #af3c43;padding-top:8px;color:#6f6f6f;font-size:10px;}
.gc-mark{font-weight:700;color:#1a1a1a;} .num{text-align:right;font-variant-numeric:tabular-nums;}`
  const sectionHTML = (s) => {
    let html = `<h3>${s.heading}</h3>`
    if (s.columns) {
      html += `<table><thead><tr>${s.columns.map((c, i) => `<th class="${i>0?'num':''}">${c}</th>`).join("")}</tr></thead><tbody>`
      html += s.rows.map(r => `<tr>${r.map((cell, i) => `<td class="${i>0?'num':''}">${cell}</td>`).join("")}</tr>`).join("")
      html += `</tbody></table>`
    } else {
      html += `<div class="kv">${s.rows.map(([k, v]) => `<div class="k">${k}</div><div class="v">${v}</div>`).join("")}</div>`
    }
    return html
  }
  const reportsHTML = reports.map(r => `<h2>${r.title}</h2>${(r.sections || []).map(sectionHTML).join("")}`).join("")
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${reportTitle}</title><style>${css}</style></head>
<body><h1><span class="gc-mark">Government of Canada</span> · Contract Intelligence</h1>
<div class="meta">${reportTitle} · Generated ${today} · Source: Open Government — Contracts over $10,000 (CKAN)</div>
${reportsHTML}
<div class="footer">Contract Intelligence Dashboard — Government of Canada · Data: open.canada.ca</div>
</body></html>`
}

export function downloadHTML(filename, html) {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
