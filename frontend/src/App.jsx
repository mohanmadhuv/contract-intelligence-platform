import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Icon, buildReportHTML, downloadHTML } from './components'
import ChatWidget from './components/ChatWidget'

const OverviewView = lazy(() => import('./views/OverviewView'))
const CategoryView = lazy(() => import('./views/CategoryView'))
const VendorView = lazy(() => import('./views/VendorView'))
const ContractsView = lazy(() => import('./views/ContractsView'))
const WatchlistView = lazy(() => import('./views/WatchlistView'))
const TrendView = lazy(() => import('./views/TrendView'))
const MapView = lazy(() => import('./views/MapView'))

const NAV = [
  { key: 'overview',  label: 'Overview',             icon: 'overview',  section: 'Analysis' },
  { key: 'category',  label: 'Category deep-dive',   icon: 'category',  section: 'Analysis' },
  { key: 'vendor',    label: 'Vendor concentration',  icon: 'vendor',    section: 'Analysis' },
  { key: 'contracts', label: 'Contracts',             icon: 'contracts', section: 'Analysis' },
  { key: 'watchlist', label: 'Less for more',         icon: 'watch',     section: 'Analysis' },
  { key: 'trend',     label: 'Time-series',           icon: 'trend',     section: 'Explore' },
  { key: 'map',       label: 'Geography',             icon: 'map',       section: 'Explore' },
]

const FISCAL_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

export default function App() {
  const [view, setView] = useState('overview')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [fyFrom, setFyFrom] = useState(2015)
  const [fyTo, setFyTo] = useState(2025)
  const exportersRef = useRef({})

  const registerExport = (key, fn) => { exportersRef.current[key] = fn }

  const onJumpTo = (v, code) => {
    setView(v)
    if (code) setSelectedCategory(code)
    else if (v !== 'category') setSelectedCategory(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fyQuery = `year_from=${fyFrom}&year_to=${fyTo}`
  const analysisNav = NAV.filter(n => n.section === 'Analysis')
  const exploreNav = NAV.filter(n => n.section === 'Explore')
  const activeLabel = NAV.find(n => n.key === view)?.label

  const exportCurrent = () => {
    const fn = exportersRef.current[view]
    if (!fn) return
    const report = fn()
    const html = buildReportHTML(report.title, [report])
    downloadHTML(`contract-intelligence-${view}-${new Date().toISOString().slice(0,10)}.html`, html)
  }

  const ViewComponent = {
    overview: OverviewView, category: CategoryView, vendor: VendorView,
    contracts: ContractsView, watchlist: WatchlistView, trend: TrendView, map: MapView,
  }[view]

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="nav-section-label">Analysis</div>
          <div className="nav-list">
            {analysisNav.map(n => (
              <button key={n.key} className={`nav-item ${view === n.key ? 'active' : ''}`} onClick={() => onJumpTo(n.key)}>
                <span className="nav-icon"><Icon name={n.icon} size={15}/></span>{n.label}
              </button>
            ))}
          </div>
        </div>
        <div className="sidebar-section">
          <div className="nav-section-label">Explore</div>
          <div className="nav-list">
            {exploreNav.map(n => (
              <button key={n.key} className={`nav-item ${view === n.key ? 'active' : ''}`} onClick={() => onJumpTo(n.key)}>
                <span className="nav-icon"><Icon name={n.icon} size={15}/></span>{n.label}
              </button>
            ))}
          </div>
        </div>
        <div className="sidebar-section" style={{ marginTop: 'auto', fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          <div className="nav-section-label" style={{ padding: '0 0 6px' }}>Data source</div>
          <div style={{ padding: '0 10px' }}>
            Open Government — Contracts over $10K (CKAN)<br/>
            <span className="mono-tag">resource fac950c0…</span>
            <div style={{ marginTop: 4 }}>BigQuery · {fyFrom}–{fyTo}</div>
          </div>
        </div>
      </aside>

      {/* Right column */}
      <div className="shell">
        {/* GoC FIP signature */}
        <div className="gc-fip">
          <div className="gc-wordmark">Government of Canada<span className="gc-wordmark-flag" aria-hidden="true"/></div>
          <a href="#" className="gc-lang" onClick={e => e.preventDefault()}>Français</a>
        </div>

        {/* Application title bar */}
        <div className="gc-app-bar">
          <div>
            <div className="gc-app-title">Contract Intelligence</div>
            <div className="gc-app-sub">Public Services and Procurement Canada · Open Government analytics</div>
          </div>
          <div className="gc-app-bar-right">
            <span className="connection-pill" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <span className="connection-dot"/>Connected · BigQuery
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Synced {new Date().toISOString().slice(0, 10)}</span>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="gc-crumbs">
          <a href="#" onClick={e => e.preventDefault()}>Canada.ca</a>
          <span className="sep">›</span>
          <a href="#" onClick={e => e.preventDefault()}>Open Government</a>
          <span className="sep">›</span>
          <a href="#" onClick={e => e.preventDefault()}>Procurement</a>
          <span className="sep">›</span>
          <b>{activeLabel}</b>
        </div>

        {/* Toolbar with FY filter */}
        <div className="toolbar">
          <div className="toolbar-meta">
            <span><b style={{ color: 'var(--text)' }}>{activeLabel}</b></span>
            <span className="divider-v"/>
            <div className="fy-filter">
              <span className="filter-label">FY</span>
              <select value={fyFrom} onChange={e => setFyFrom(Number(e.target.value))}>
                {FISCAL_YEARS.map(y => <option key={y} value={y}>FY{String(y).slice(2)}</option>)}
              </select>
              <span className="fy-arrow">→</span>
              <select value={fyTo} onChange={e => setFyTo(Number(e.target.value))}>
                {FISCAL_YEARS.filter(y => y >= fyFrom).map(y => <option key={y} value={y}>FY{String(y).slice(2)}</option>)}
              </select>
            </div>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-sm" onClick={exportCurrent} title="Download report for current view">
              <Icon name="download" size={12}/> Download this view
            </button>
          </div>
        </div>

        {/* Main content */}
        <main className="main">
          <Suspense fallback={<div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading…</div>}>
            <ViewComponent
              key={`${view}-${fyFrom}-${fyTo}`}
              onJumpTo={onJumpTo}
              initialCode={selectedCategory}
              registerExport={registerExport}
              fyFrom={fyFrom}
              fyTo={fyTo}
              fyQuery={fyQuery}
            />
          </Suspense>
        </main>

        {/* Footer */}
        <footer className="gc-footer">
          <div>
            <a href="#" onClick={e => e.preventDefault()}>Contact</a>
            <a href="#" onClick={e => e.preventDefault()}>Terms and conditions</a>
            <a href="#" onClick={e => e.preventDefault()}>Privacy</a>
            <a href="#" onClick={e => e.preventDefault()}>Open Government</a>
          </div>
          <div className="gc-footer-mark">Canada<span className="gc-wordmark-flag" aria-hidden="true" style={{ background: 'white' }}/></div>
        </footer>
      </div>

      {/* AI Chat Widget */}
      <ChatWidget/>
    </div>
  )
}
