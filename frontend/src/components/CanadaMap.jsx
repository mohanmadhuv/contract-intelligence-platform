import { useState } from 'react'
import { fmtCAD, fmtPct } from '../components'

// Simplified SVG paths for Canadian provinces/territories
// These are real geographic outlines (simplified for performance)
const PROVINCES = {
  BC: { path: "M52,195 L42,160 L35,140 L30,120 L38,100 L50,85 L65,80 L75,90 L80,110 L85,130 L90,155 L88,175 L80,195 L65,205 Z", cx: 60, cy: 145, name: "British Columbia" },
  AB: { path: "M90,100 L90,190 L125,190 L125,100 Z", cx: 107, cy: 145, name: "Alberta" },
  SK: { path: "M125,100 L125,190 L160,190 L160,100 Z", cx: 142, cy: 145, name: "Saskatchewan" },
  MB: { path: "M160,100 L160,190 L195,190 L200,175 L198,150 L195,120 L190,100 Z", cx: 178, cy: 145, name: "Manitoba" },
  ON: { path: "M195,120 L198,150 L200,175 L210,195 L225,210 L245,215 L260,210 L270,195 L275,175 L270,155 L260,140 L245,130 L230,125 L215,120 Z", cx: 240, cy: 170, name: "Ontario" },
  QC: { path: "M270,155 L275,175 L280,190 L290,200 L305,205 L320,200 L335,190 L345,175 L350,155 L345,135 L335,115 L320,100 L305,95 L290,100 L280,115 L275,135 Z", cx: 310, cy: 150, name: "Quebec" },
  NB: { path: "M340,195 L345,205 L355,210 L365,205 L368,195 L362,188 L350,185 Z", cx: 354, cy: 198, name: "New Brunswick" },
  NS: { path: "M365,198 L370,205 L380,210 L390,208 L395,200 L388,193 L378,190 L370,192 Z", cx: 380, cy: 200, name: "Nova Scotia" },
  PE: { path: "M372,185 L378,182 L385,185 L382,190 L375,190 Z", cx: 378, cy: 186, name: "Prince Edward Island" },
  NL: { path: "M370,130 L380,120 L395,115 L405,120 L410,135 L405,150 L395,160 L385,165 L375,160 L370,145 Z", cx: 390, cy: 140, name: "Newfoundland and Labrador" },
  YT: { path: "M35,30 L35,80 L65,80 L68,65 L65,45 L60,30 Z", cx: 50, cy: 55, name: "Yukon" },
  NT: { path: "M65,30 L65,80 L75,85 L90,100 L125,100 L155,85 L170,65 L175,45 L165,30 L130,25 L100,25 Z", cx: 120, cy: 60, name: "Northwest Territories" },
  NU: { path: "M175,20 L175,45 L170,65 L180,80 L195,90 L210,85 L230,75 L250,60 L270,45 L280,30 L275,20 L250,10 L225,8 L200,12 Z", cx: 225, cy: 45, name: "Nunavut" },
}

// Provincial flag URLs from Wikimedia Commons (public domain)
const FLAG_URLS = {
  AB: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Flag_of_Alberta.svg/200px-Flag_of_Alberta.svg.png",
  BC: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Flag_of_British_Columbia.svg/200px-Flag_of_British_Columbia.svg.png",
  MB: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Flag_of_Manitoba.svg/200px-Flag_of_Manitoba.svg.png",
  NB: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Flag_of_New_Brunswick.svg/200px-Flag_of_New_Brunswick.svg.png",
  NL: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Flag_of_Newfoundland_and_Labrador.svg/200px-Flag_of_Newfoundland_and_Labrador.svg.png",
  NS: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Flag_of_Nova_Scotia.svg/200px-Flag_of_Nova_Scotia.svg.png",
  NT: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Flag_of_the_Northwest_Territories.svg/200px-Flag_of_the_Northwest_Territories.svg.png",
  NU: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Flag_of_Nunavut.svg/200px-Flag_of_Nunavut.svg.png",
  ON: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_Ontario.svg/200px-Flag_of_Ontario.svg.png",
  PE: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Flag_of_Prince_Edward_Island.svg/200px-Flag_of_Prince_Edward_Island.svg.png",
  QC: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Flag_of_Quebec.svg/200px-Flag_of_Quebec.svg.png",
  SK: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Flag_of_Saskatchewan.svg/200px-Flag_of_Saskatchewan.svg.png",
  YT: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Flag_of_Yukon.svg/200px-Flag_of_Yukon.svg.png",
}

export default function CanadaMap({ data, totalSpend }) {
  const [hover, setHover] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(r => r.spend))

  const colorFor = (spend) => {
    const ratio = spend / max
    const r = Math.round(40 + (1 - ratio) * 200)
    const g = Math.round(65 + (1 - ratio) * 180)
    const b = Math.round(98 + (1 - ratio) * 140)
    return `rgb(${r},${g},${b})`
  }

  const handleMouseMove = (e, code) => {
    const rect = e.currentTarget.closest('.canada-map').getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setHover(code)
  }

  return (
    <div className="canada-map" style={{ position: 'relative' }}>
      <svg viewBox="0 0 440 230" style={{ width: '100%', display: 'block' }}>
        <defs>
          {/* Define clip paths for each province */}
          {Object.entries(PROVINCES).map(([code, prov]) => (
            <clipPath key={`clip-${code}`} id={`clip-${code}`}>
              <path d={prov.path}/>
            </clipPath>
          ))}
        </defs>

        {Object.entries(PROVINCES).map(([code, prov]) => {
          const d = data.find(r => r.code === code)
          const spend = d ? d.spend : 0
          const isHovered = hover === code

          return (
            <g key={code}
               onMouseMove={(e) => handleMouseMove(e, code)}
               onMouseLeave={() => setHover(null)}>
              {/* Province shape */}
              <path
                d={prov.path}
                className="province"
                style={{
                  fill: spend > 0 ? colorFor(spend) : 'var(--bg-inset)',
                  stroke: isHovered ? 'var(--text)' : 'white',
                  strokeWidth: isHovered ? 2 : 1,
                }}
              />

              {/* Flag overlay on hover */}
              {isHovered && FLAG_URLS[code] && (
                <image
                  href={FLAG_URLS[code]}
                  clipPath={`url(#clip-${code})`}
                  x={prov.cx - 40}
                  y={prov.cy - 25}
                  width="80"
                  height="50"
                  className="map-flag-overlay"
                  preserveAspectRatio="xMidYMid slice"
                  style={{ opacity: 0.15, filter: 'grayscale(100%)' }}
                />
              )}

              {/* Province label */}
              <text
                x={prov.cx}
                y={prov.cy + 4}
                className="province-label"
                style={{
                  fontSize: code === 'PE' ? '7px' : '9px',
                  fill: spend > 0 ? 'white' : 'var(--text-secondary)',
                  fontWeight: isHovered ? 800 : 700,
                }}
              >
                {code}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {hover && (() => {
        const d = data.find(r => r.code === hover)
        const prov = PROVINCES[hover]
        if (!d || !prov) return null
        const pct = totalSpend > 0 ? d.spend / totalSpend : 0
        return (
          <div className="map-tooltip" style={{ left: mousePos.x, top: mousePos.y - 10, transform: 'translate(-50%, -110%)' }}>
            <b>{prov.name}</b><br/>
            <span style={{ color: 'var(--text-secondary)' }}>Spend:</span> {fmtCAD(d.spend)}<br/>
            <span style={{ color: 'var(--text-secondary)' }}>Contracts:</span> {(d.contracts || 0).toLocaleString()}<br/>
            <span style={{ color: 'var(--text-secondary)' }}>Share:</span> {fmtPct(pct)}
          </div>
        )
      })()}
    </div>
  )
}
