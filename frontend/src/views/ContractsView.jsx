import { useState, useCallback } from 'react'
import { fmtCAD, Icon, useApi } from '../components'

export default function ContractsView() {
  const [search, setSearch] = useState('')
  const [fy, setFy] = useState('')
  const [sortKey, setSortKey] = useState('amendment_ratio')
  const [sortDir, setSortDir] = useState('desc')

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (fy) params.set('fy', fy)
  params.set('sort_key', sortKey)
  params.set('sort_dir', sortDir)

  const { data: rows, loading } = useApi(`/api/contracts?${params}`)

  const toggleSort = useCallback((key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }, [sortKey])

  const SH = ({ k, label, num }) => (
    <th className={`${num?'num':''} ${sortKey===k?'sorted':''}`} onClick={()=>toggleSort(k)}>
      {label}<span className="sort-arrow">{sortKey===k?(sortDir==='asc'?'↑':'↓'):'↕'}</span>
    </th>
  )

  const years = Array.from({length:11}, (_,i) => 2015+i)

  return (
    <div className="tab-fade" style={{display:'flex',flexDirection:'column',gap:22}}>
      <div className="page-head">
        <div className="page-eyebrow">Contracts · last 10 fiscal years</div>
        <div className="page-title">Contract-level view, with amendment-ratio flags</div>
        <div className="page-sub">Sort by amendment ratio to surface contracts that quietly grew well past their initial scope.</div>
      </div>

      <div className="filter-bar">
        <div className="row" style={{gap:6}}>
          <Icon name="search" size={14}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendor, title, ref…" style={{background:'transparent',border:'none',outline:'none',fontSize:13,width:220,color:'var(--text)'}}/>
        </div>
        <div className="divider-v"/>
        <span className="filter-label">FY</span>
        <select className="btn btn-sm" value={fy} onChange={e=>setFy(e.target.value)}>
          <option value="">All</option>
          {years.map(y=><option key={y} value={y}>FY{String(y).slice(2)}</option>)}
        </select>
        <div className="spacer"/>
        <span className="text-tert" style={{fontSize:12}}>{rows?.length || 0} shown</span>
      </div>

      <div className="card">
        <div className="card-body" style={{padding:0}}>
          <table className="tbl">
            <thead><tr>
              <SH k="reference_number" label="Reference"/>
              <SH k="fiscal_year" label="FY" num/>
              <SH k="vendor" label="Vendor"/>
              <th>Category</th>
              <SH k="original_value" label="Original" num/>
              <SH k="total_value" label="Total" num/>
              <SH k="amendment_ratio" label="Ratio" num/>
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{padding:20,color:'var(--text-tertiary)'}}>Loading…</td></tr>}
              {rows?.map(c => {
                const flag = c.amendment_ratio > 1.6 ? 'critical' : c.amendment_ratio > 1.2 ? 'warning' : null
                return (
                  <tr key={c.reference_number}>
                    <td><div className="mono" style={{color:'var(--text)'}}>{c.reference_number}</div><div className="text-tert" style={{fontSize:11.5,marginTop:2}}>{c.title}</div></td>
                    <td className="num">FY{String(c.fiscal_year).slice(2)}</td>
                    <td>{c.vendor}</td>
                    <td><span className="chip">{c.category_code}</span></td>
                    <td className="num">{fmtCAD(c.original_value)}</td>
                    <td className="num"><b>{fmtCAD(c.total_value)}</b></td>
                    <td className="num">
                      {flag ? <span className={`chip chip-${flag}`}>{c.amendment_ratio}×</span> : <span className="text-sec">{c.amendment_ratio}×</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
