import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import ReviewPage from './pages/ReviewPage'
import DashboardPage from './pages/DashboardPage'

function Navbar() {
  const [alerts,     setAlerts]     = useState([])
  const [alertCount, setAlertCount] = useState(0)
  const [showAlerts, setShowAlerts] = useState(false)
  const bellRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/alerts/`).then(r => {
      const data = r.data.flagged_businesses || []
      setAlerts(data)
      const total = data.reduce((sum, b) => sum + b.alerts.length, 0)
      setAlertCount(total)
    })
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowAlerts(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav style={{
      background: '#0f2744', padding: '14px 32px',
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', position: 'sticky', top: 0, zIndex: 999
    }}>
      {/* Left — logo and links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 20, letterSpacing: 1 }}>
          🏛 TRACEX
        </span>
        <Link to="/" style={{
          color: location.pathname === '/' ? 'white' : '#93c5fd',
          textDecoration: 'none', fontSize: 14, fontWeight: location.pathname === '/' ? 600 : 400,
          borderBottom: location.pathname === '/' ? '2px solid white' : 'none',
          paddingBottom: 2
        }}>
          Dashboard
        </Link>
        <Link to="/review" style={{
          color: location.pathname === '/review' ? 'white' : '#93c5fd',
          textDecoration: 'none', fontSize: 14, fontWeight: location.pathname === '/review' ? 600 : 400,
          borderBottom: location.pathname === '/review' ? '2px solid white' : 'none',
          paddingBottom: 2
        }}>
          Review Queue
        </Link>
      </div>

      {/* Right — bell icon */}
      <div ref={bellRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowAlerts(!showAlerts)}
          style={{
            background: showAlerts ? '#1e4a7a' : 'transparent',
            border: '1px solid #1e4a7a', borderRadius: 10,
            padding: '8px 14px', cursor: 'pointer',
            color: 'white', fontSize: 20, position: 'relative',
            transition: 'background 0.2s'
          }}
        >
          🔔
          {alertCount > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: '#dc2626', color: 'white',
              borderRadius: '50%', width: 20, height: 20,
              fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #0f2744'
            }}>
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {showAlerts && (
          <div style={{
            position: 'absolute', right: 0, top: 48,
            width: 380, background: 'white',
            borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            zIndex: 1000, overflow: 'hidden',
            border: '1px solid #e2e8f0'
          }}>
            {/* Header */}
            <div style={{
              background: '#0f2744', padding: '14px 18px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>
                🔔 System Alerts
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{
                  background: '#dc2626', color: 'white',
                  borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600
                }}>
                  {alertCount} alerts
                </span>
                {/* Close button */}
                <button
                  onClick={() => setShowAlerts(false)}
                  style={{
                    background: 'transparent', border: 'none',
                    color: '#93c5fd', fontSize: 18, cursor: 'pointer',
                    lineHeight: 1, padding: 0
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Alert list */}
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {alerts.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                  ✅ No alerts right now
                </div>
              )}
              {alerts.map((biz, idx) => (
                <div key={biz.ubid} style={{
                  padding: '14px 18px',
                  borderBottom: idx < alerts.length - 1 ? '1px solid #f1f5f9' : 'none',
                  cursor: 'default'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#0f2744' }}>
                      {biz.company_name}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, borderRadius: 4, padding: '2px 8px',
                      background: biz.status === 'ACTIVE' ? '#dcfce7' : biz.status === 'DORMANT' ? '#fef9c3' : '#fee2e2',
                      color: biz.status === 'ACTIVE' ? '#166534' : biz.status === 'DORMANT' ? '#854d0e' : '#991b1b'
                    }}>
                      {biz.status}
                    </span>
                  </div>
                  {biz.alerts.map((al, i) => (
                    <div key={i} style={{
                      fontSize: 12, marginTop: 4, display: 'flex', gap: 6,
                      color: al.type === 'DANGER' ? '#991b1b' : al.type === 'WARNING' ? '#854d0e' : '#1e40af'
                    }}>
                      <span>{al.type === 'DANGER' ? '🔴' : al.type === 'WARNING' ? '🟡' : '🔵'}</span>
                      <span>{al.message}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 18px', background: '#f8fafc',
              borderTop: '1px solid #e2e8f0', textAlign: 'center'
            }}>
              <button
                onClick={() => setShowAlerts(false)}
                style={{
                  background: '#0f2744', color: 'white', border: 'none',
                  borderRadius: 8, padding: '8px 24px', fontSize: 13,
                  cursor: 'pointer', fontWeight: 600
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"       element={<DashboardPage />} />
        <Route path="/review" element={<ReviewPage />} />
      </Routes>
    </BrowserRouter>
  )
}
// redeploy fix