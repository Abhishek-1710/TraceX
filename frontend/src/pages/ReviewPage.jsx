import { useState, useEffect } from 'react'
import axios from 'axios'

const badge = (conf) => {
  if (conf >= 0.85) return { label: 'HIGH',   bg: '#16a34a', color: '#fff' }
  if (conf >= 0.60) return { label: 'MEDIUM', bg: '#d97706', color: '#fff' }
  return                    { label: 'LOW',    bg: '#dc2626', color: '#fff' }
}

const Field = ({ label, value }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 500 }}>{value || '—'}</div>
  </div>
)

export default function ReviewPage() {
  const [queue,   setQueue]   = useState([])
  const [stats,   setStats]   = useState({})
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
  try {
    setLoading(true)

    const [q, s] = await Promise.all([
      axios.get('/api/review/queue'),
      axios.get('/api/review/stats')
    ])

    setQueue(q.data.items)
    setStats(s.data)

  } catch (err) {
    console.error("Failed to fetch review data", err)
  } finally {
    setLoading(false)
  }
}
  useEffect(() => { fetchAll() }, [])

  const decide = async (id, decision) => {
    await axios.post('/api/review/decide', { queue_id: id, decision })
    fetchAll()
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Human Review Queue</h1>
      <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
        Review borderline matches. Approve if same business, reject if different.
      </p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {[
          ['Pending',  stats.pending,  '#d97706'],
          ['Approved', stats.approved, '#16a34a'],
          ['Rejected', stats.rejected, '#dc2626'],
          ['Total',    stats.total,    '#6366f1'],
        ].map(([label, val, color]) => (
          <div key={label} style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 10, padding: '12px 20px', textAlign: 'center', minWidth: 90
          }}>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{val ?? 0}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
          </div>
        ))}
      </div>

      {loading && <p style={{ color: '#94a3b8' }}>Loading...</p>}

      {!loading && queue.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 15 }}>
          Queue is empty — nothing to review right now.
        </div>
      )}

      {queue.map(item => {
        const b = badge(item.confidence)
        return (
          <div key={item.id} style={{
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 12, padding: 24, marginBottom: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>ID: {item.id.slice(0, 12)}...</span>
              <span style={{
                background: b.bg, color: b.color, borderRadius: 6,
                padding: '4px 12px', fontSize: 12, fontWeight: 600
              }}>
                {b.label} — {(item.confidence * 100).toFixed(0)}% match
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[['Record A (Source 1)', item.record_a], ['Record B (Source 2)', item.record_b]].map(([title, rec]) => (
                <div key={title} style={{ background: '#f8fafc', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#0f2744' }}>{title}</div>
                  <Field label="Company Name" value={rec?.company_name} />
                  <Field label="PAN"          value={rec?.pan} />
                  <Field label="GSTIN"        value={rec?.gstin} />
                  <Field label="Address"      value={rec?.address} />
                  <Field label="State"        value={rec?.state} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => decide(item.id, 'approve')} style={{
                background: '#16a34a', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14
              }}>
                ✓ Same Business — Approve
              </button>
              <button onClick={() => decide(item.id, 'reject')} style={{
                background: '#dc2626', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14
              }}>
                ✗ Different Business — Reject
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}