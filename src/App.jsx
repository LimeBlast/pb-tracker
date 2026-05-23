import { useState, useEffect } from 'react'
import DistanceCard from './components/DistanceCard.jsx'
import ImprovementChart from './components/ImprovementChart.jsx'
import YearlyBestsTable from './components/YearlyBestsTable.jsx'
import { formatTime, formatPace, formatDate, computeAllTimeBest } from './utils/formatters.js'

const DISTANCES = [
  { id: '1_mile',        name: '1 Mile',        meters: 1609.34  },
  { id: '5k',            name: '5K',             meters: 5000     },
  { id: '10k',           name: '10K',            meters: 10000    },
  { id: 'half_marathon', name: 'Half Marathon',  meters: 21097.5  },
  { id: 'marathon',      name: 'Marathon',       meters: 42195    },
]

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState('5k')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/pbs.json`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const selectedConfig = DISTANCES.find(d => d.id === selected)
  const selectedEfforts = data?.distances?.[selected]?.efforts ?? []
  const allTimeBest = computeAllTimeBest(selectedEfforts)

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <span className="header-icon">🏃</span>
            <h1>PB Tracker</h1>
          </div>
          {data?.last_updated && (
            <span className="last-updated">
              Updated {formatDate(data.last_updated.slice(0, 10))}
            </span>
          )}
        </div>
      </header>

      <main className="app-main">
        {loading && (
          <div className="state-message">
            <div className="spinner" />
            Loading your PBs…
          </div>
        )}

        {error && (
          <div className="state-message error">
            <p>Could not load data.</p>
            <p className="error-detail">{error}</p>
            <p>Run the <strong>Update Strava Data</strong> GitHub Actions workflow to fetch your Strava data.</p>
          </div>
        )}

        {data && !loading && (
          <>
            <div className="distance-grid">
              {DISTANCES.map(config => (
                <DistanceCard
                  key={config.id}
                  config={config}
                  efforts={data.distances?.[config.id]?.efforts ?? []}
                  selected={selected === config.id}
                  onClick={() => setSelected(config.id)}
                />
              ))}
            </div>

            <section className="detail-section">
              <div className="detail-header">
                <h2 className="detail-title">{selectedConfig.name}</h2>
                {allTimeBest ? (
                  <div className="detail-pb">
                    <div className="detail-pb-time">{formatTime(allTimeBest.elapsed_time)}</div>
                    <div className="detail-pb-meta">
                      <span>{formatPace(allTimeBest.elapsed_time, selectedConfig.meters)}</span>
                      <span className="dot-sep">·</span>
                      <span>{formatDate(allTimeBest.date)}</span>
                      <span className="dot-sep">·</span>
                      <a
                        href={`https://www.strava.com/activities/${allTimeBest.activity_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {allTimeBest.activity_name}
                      </a>
                    </div>
                    <div className="detail-pb-count">
                      {selectedEfforts.length} effort{selectedEfforts.length !== 1 ? 's' : ''} recorded
                    </div>
                  </div>
                ) : (
                  <p className="no-data">No {selectedConfig.name} efforts recorded yet.</p>
                )}
              </div>

              {selectedEfforts.length > 1 && (
                <>
                  <h3 className="section-title">Improvement Over Time</h3>
                  <ImprovementChart efforts={selectedEfforts} config={selectedConfig} />
                </>
              )}

              <YearlyBestsTable efforts={selectedEfforts} config={selectedConfig} />
            </section>
          </>
        )}
      </main>

      <footer className="app-footer">
        Data from <a href="https://www.strava.com" target="_blank" rel="noopener noreferrer">Strava</a>
      </footer>
    </div>
  )
}
