import { useState, useEffect } from 'react'
import axios from 'axios'

const STATUS = {
  ACTIVE:  { bg: '#dcfce7', color: '#166534' },
  DORMANT: { bg: '#fef9c3', color: '#854d0e' },
  CLOSED:  { bg: '#fee2e2', color: '#991b1b' },
}

const ALERT_COLOR = {
  DANGER:  { color: '#991b1b', icon: '🔴' },
  WARNING: { color: '#854d0e', icon: '🟡' },
  INFO:    { color: '#1e40af', icon: '🔵' },
}

const Detail = ({ label, value }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}>{value || '—'}</div>
  </div>
)

export default function DashboardPage() {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [alerts,   setAlerts]   = useState([])
  const [selected, setSelected] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [allBiz,   setAllBiz]   = useState([])

  useEffect(() => {
    axios.get('/api/alerts/').then(r => setAlerts(r.data.flagged_businesses || []))
    axios.get('/api/business/all').then(r => setAllBiz(r.data.results || []))
  }, [])

  const search = async () => {
    if (!query.trim()) { setResults([]); return }
    setLoading(true)
    const r = await axios.get(`/api/business/search?q=${encodeURIComponent(query)}`)
    setResults(r.data.results)
    setSelected(null)
    setLoading(false)
  }

  const displayList = query ? results : allBiz

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: 32 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: '#0f2744' }}>
          Government Dashboard
        </h1>
        <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
          Search and monitor all registered businesses · {allBiz.length} total registered
        </p>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search by company name or UBID..."
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 10,
              border: '1px solid #cbd5e1', fontSize: 15,
              outline: 'none', background: 'white'
            }}
          />
          <button onClick={search} style={{
            background: '#0f2744', color: '#fff', border: 'none',
            borderRadius: 10, padding: '12px 28px',
            fontSize: 15, cursor: 'pointer', fontWeight: 600
          }}>
            Search
          </button>
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setSelected(null) }} style={{
              background: 'white', color: '#64748b', border: '1px solid #cbd5e1',
              borderRadius: 10, padding: '12px 18px', fontSize: 14, cursor: 'pointer'
            }}>
              Clear
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>

          {/* Business list */}
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
              {displayList.length} businesses found
            </div>

            {loading && <p style={{ color: '#94a3b8' }}>Searching...</p>}

            {displayList.map(biz => {
              const s = STATUS[biz.status] || STATUS.DORMANT
              const isSelected = selected?.ubid === biz.ubid
              const hasAlert = alerts.find(a => a.ubid === biz.ubid)

              return (
                <div key={biz.ubid}
                  onClick={() => setSelected(biz)}
                  style={{
                    background: 'white',
                    border: isSelected ? '2px solid #0f2744' : '1px solid #e2e8f0',
                    borderRadius: 12, padding: 18, marginBottom: 12,
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: isSelected ? '0 2px 12px rgba(15,39,68,0.10)' : 'none'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{biz.company_name}</span>
                      {hasAlert && (
                        <span style={{
                          background: '#fef9c3', color: '#854d0e',
                          fontSize: 11, borderRadius: 4, padding: '2px 6px', fontWeight: 600
                        }}>
                          ⚠ {hasAlert.alerts.length} alert{hasAlert.alerts.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <span style={{
                      background: s.bg, color: s.color,
                      borderRadius: 6, padding: '3px 12px', fontSize: 12, fontWeight: 600
                    }}>
                      {biz.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    UBID: {biz.ubid} &nbsp;·&nbsp; PAN: {biz.pan || '—'} &nbsp;·&nbsp; GSTIN: {biz.gstin || '—'}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{biz.address}</div>
                </div>
              )
            })}

            {displayList.length === 0 && !loading && query && (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                No results found for "{query}"
              </div>
            )}
          </div>

          {/* Right panel */}
          <div>
            {selected ? (
              <div style={{
                background: 'white', border: '1px solid #e2e8f0',
                borderRadius: 12, padding: 20, position: 'sticky', top: 20
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: '#0f2744' }}>
                  Business Details
                </div>
                <Detail label="UBID"         value={selected.ubid} />
                <Detail label="Company Name" value={selected.company_name} />
                <Detail label="PAN"          value={selected.pan} />
                <Detail label="GSTIN"        value={selected.gstin} />
                <Detail label="Address"      value={selected.address} />
                <Detail label="State"        value={selected.state} />
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Status</div>
                  <span style={{
                    background: STATUS[selected.status]?.bg,
                    color: STATUS[selected.status]?.color,
                    borderRadius: 6, padding: '4px 12px', fontSize: 13, fontWeight: 600
                  }}>
                    {selected.status}
                  </span>
                </div>

                {alerts.find(a => a.ubid === selected.ubid) && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f2744', marginBottom: 10 }}>
                      Active Alerts
                    </div>
                    {alerts.find(a => a.ubid === selected.ubid).alerts.map((al, i) => {
                      const s = ALERT_COLOR[al.type] || ALERT_COLOR.INFO
                      return (
                        <div key={i} style={{
                          fontSize: 12, color: s.color,
                          marginBottom: 6, display: 'flex', gap: 6
                        }}>
                          <span>{s.icon}</span>
                          <span>{al.message}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                <button
                  onClick={() => setSelected(null)}
                  style={{
                    marginTop: 16, width: '100%', background: '#f1f5f9',
                    border: '1px solid #e2e8f0', borderRadius: 8,
                    padding: '8px', fontSize: 13, cursor: 'pointer', color: '#64748b'
                  }}
                >
                  Close Details
                </button>
              </div>
            ) : (
              <div style={{
                background: 'white', border: '1px solid #e2e8f0',
                borderRadius: 12, padding: 40, textAlign: 'center', color: '#94a3b8'
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
                <div style={{ fontSize: 14 }}>Click any business to view details</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}