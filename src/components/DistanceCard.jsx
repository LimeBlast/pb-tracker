import { formatTime, formatPace, formatDate, computeAllTimeBest } from '../utils/formatters.js'

export default function DistanceCard({ config, efforts, selected, onClick }) {
  const best = computeAllTimeBest(efforts)

  return (
    <button
      className={`distance-card ${selected ? 'selected' : ''} ${!best ? 'empty' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="distance-card-name">{config.name}</span>
      {best ? (
        <>
          <span className="distance-card-time">{formatTime(best.elapsed_time)}</span>
          <span className="distance-card-pace">{formatPace(best.elapsed_time, config.meters)}</span>
          <span className="distance-card-date">{formatDate(best.date)}</span>
        </>
      ) : (
        <span className="distance-card-empty">No data yet</span>
      )}
    </button>
  )
}
