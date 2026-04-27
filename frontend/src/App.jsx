import { useState, useEffect, lazy, Suspense } from 'react'
import { Icon } from './components'

const OverviewView = lazy(() => import('./views/OverviewView'))
const CategoryView = lazy(() => import('./views/CategoryView'))
const VendorView = lazy(() => import('./views/VendorView'))
const ContractsView = lazy(() => import('./views/ContractsView'))
const WatchlistView = lazy(() => import('./views/WatchlistView'))
const TrendView = lazy(() => import('./views/TrendView'))
const MapView = lazy(() => import('./views/MapView'))

const NAV = [
  { key:'overview', label:'Overview', icon:'overview', section:'Analysis' },
  { key:'category', label:'Category deep-dive', icon:'category', section:'Analysis' },
  { key:'vendor', label:'Vendor concentration', icon:'vendor', section:'Analysis' },
  { key:'contracts', label:'Contracts', icon:'contracts', section:'Analysis' },
  { key:'watchlist', label:'Less for more', icon:'watch', section:'Analysis' },
  { key:'trend', label:'Time-series', icon:'trend', section:'Explore' },
  { key:'map', label:'Geography', icon:'map', section:'Explore' },
]

export default function App() {
  const [view, setView] = useState('overview')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [theme, setTheme] = useState('dark')

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  const onJumpTo = (v, code) => {
    setView(v)
    if (code) setSelectedCategory(code)
    else if (v !== 'category') setSelectedCategory(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const analysisNav = NAV.filter(n => n.section === 'Analysis')
  const exploreNav = NAV.filter(n => n.section === 'Explore')
  const activeLabel = NAV.find(n => n.key === view)?.label

  const ViewComponent = {
    overview: OverviewView, category: CategoryView, vendor: VendorView,
    contracts: ContractsView, watchlist: WatchlistView, trend: TrendView, map: MapView,
  }[view]

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CI</div>
          <div><div className="brand-name">Contract Intelligence</div><div className="brand-sub">Government of Canada</div></div>
        </div>

        <div>
          <div className="nav-section-label">Analysis</div>
          <div className="nav-list">
            {analysisNav.map(n => (
              <button key={n.key} className={`nav-item ${view===n.key?'active':''}`} onClick={()=>onJumpTo(n.key)}>
                <span className="nav-icon"><Icon name={n.icon} size={15}/></span>{n.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="nav-section-label">Explore</div>
          <div className="nav-list">
            {exploreNav.map(n => (
              <button key={n.key} className={`nav-item ${view===n.key?'active':''}`} onClick={()=>onJumpTo(n.key)}>
                <span className="nav-icon"><Icon name={n.icon} size={15}/></span>{n.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{marginTop:'auto',padding:'0 8px',fontSize:11,color:'var(--text-tertiary)',lineHeight:1.5}}>
          <div style={{fontWeight:600,color:'var(--text-secondary)',marginBottom:4}}>Data source</div>
          Open Government — Contracts over $10K (CKAN)<br/>
          <span className="mono-tag">resource fac950c0…</span>
          <div style={{marginTop:8}}>
            <button className="btn btn-sm" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} style={{fontSize:11}}>
              {theme==='dark'?'☀ Light':'🌙 Dark'}
            </button>
          </div>
        </div>
      </aside>

      <main className="content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="crumb"><span>Procurement</span><span>/</span><b>{activeLabel}</b></div>
          </div>
          <div className="topbar-right">
            <div className="tooltip-wrap">
              <span className="connection-pill" style={{cursor: 'help'}}><span className="connection-dot"/>Connected · CKAN datastore</span>
              <div className="tooltip">
                <a href="https://open.canada.ca/data/en/dataset/fac950c0-00df-4bb6-a947-657754d92039" target="_blank" rel="noreferrer">
                  Open dataset on open.canada.ca ↗
                </a>
              </div>
            </div>
            <span className="connection-pill">Synced {new Date().toISOString().slice(0,10)}</span>
          </div>
        </div>
        <div className="main">
          <Suspense fallback={<div style={{padding:40,color:'var(--text-tertiary)'}}>Loading…</div>}>
            <ViewComponent key={view} onJumpTo={onJumpTo} initialCode={selectedCategory}/>
          </Suspense>
        </div>
      </main>
    </div>
  )
}
