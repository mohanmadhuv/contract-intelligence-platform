import { useState } from 'react'
import { fmtCAD, fmtNum, Icon, useApi } from '../components'

export default function ContractsView({ onJumpTo, registerExport, fyFrom, fyTo }) {
  const [search, setSearch] = useState('')
  const [fy, setFy] = useState('')
  const [eoc, setEoc] = useState('')
  const [sortKey, setSortKey] = useState('amendment_ratio')
  const [sortDir, setSortDir] = useState('desc')

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (fy) params.set('fy', fy)
  if (eoc) params.set('eoc', eoc)
  params.set('sort_key', sortKey)
  params.set('sort_dir', sortDir)
  params.set('limit', '80')

  const { data: rows, loading } = useApi(`/api/contracts?${params.toString()}`)

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sortArrow = (key) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const years = []
  for (let y = fyFrom; y <= fyTo; y++) years.push(y)

  return (
    <div className="tab-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div className="page-eyebrow">Contracts explorer</div>
        <h1 className="page-title">Contract-level data</h1>
      </div>

      <div className="filter-bar">
        <span className="filter-label">Search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Vendor, description, or reference…"
          style={{ flex: 1, maxWidth: 300, padding: '5px 8px', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--radius)', fontSize: 12.5, background: 'white' }}/>
        <span className="filter-label" style={{ marginLeft: 8 }}>FY</span>
        <select value={fy} onChange={e => setFy(e.target.value)}>
          <option value="">All years</option>
          {years.map(y => <option key={y} value={y}>FY{String(y).slice(2)}</option>)}
        </select>
        <span className="filter-label" style={{ marginLeft: 8 }}>EOC</span>
        <select value={eoc} onChange={e => setEoc(e.target.value)}>
          <option value="">All categories</option>
          <option value="0433">0433 · Computer Services</option>
          <option value="0491">0491 · Management Consulting</option>
          <option value="0499">0499 · Other Professional Svc</option>
          <option value="0321">0321 · Computing Equipment</option>
          <option value="0381">0381 · Construction Services</option>
        </select>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr>
            <th onClick={() => toggleSort('fiscal_year')} style={{ cursor: 'pointer' }}>FY{sortArrow('fiscal_year')}</th>
            <th onClick={() => toggleSort('vendor')} style={{ cursor: 'pointer' }}>Vendor{sortArrow('vendor')}</th>
            <th>Category</th>
            <th>Title</th>
            <th className="num" onClick={() => toggleSort('original_value')} style={{ cursor: 'pointer' }}>Original{sortArrow('original_value')}</th>
            <th className="num" onClick={() => toggleSort('total_value')} style={{ cursor: 'pointer' }}>Total{sortArrow('total_value')}</th>
            <th className="num" onClick={() => toggleSort('amendment_ratio')} style={{ cursor: 'pointer' }}>Amend %{sortArrow('amendment_ratio')}</th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>Loading…</td></tr>}
            {rows && rows.map((r, i) => {
              const ratio = r.amendment_ratio || 1
              const isFlagged = ratio > 1.5
              return (
                <tr key={i}>
                  <td><b>FY{String(r.fiscal_year).slice(2)}</b></td>
                  <td>{r.vendor}</td>
                  <td><span className="mono">{r.category_code}</span></td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.title}>{r.title}</td>
                  <td className="num">{fmtCAD(r.original_value)}</td>
                  <td className="num">{fmtCAD(r.total_value)}</td>
                  <td className="num">
                    <span className={`chip ${isFlagged ? 'chip-critical' : ratio > 1.15 ? 'chip-warning' : ''}`}>
                      {(ratio * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows && <div style={{ padding: '10px 16px', fontSize: 11, color: 'var(--text-tertiary)' }}>Showing {rows.length} contracts · sorted by {sortKey} {sortDir}</div>}
      </div>
    </div>
  )
}
