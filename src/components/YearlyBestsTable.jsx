import { formatTime, formatPace, formatDate, computeYearlyBests, computeAllTimeBest } from '../utils/formatters.js'

export default function YearlyBestsTable({ efforts, config }) {
  const yearly = computeYearlyBests(efforts)
  const allTimeBest = computeAllTimeBest(efforts)
  const years = Object.keys(yearly).sort((a, b) => b - a)

  if (!years.length) return null

  return (
    <div className="yearly-table-wrapper">
      <h3 className="section-title">Yearly Bests</h3>
      <table className="yearly-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Time</th>
            <th>Pace</th>
            <th>Date</th>
            <th>Activity</th>
          </tr>
        </thead>
        <tbody>
          {years.map(year => {
            const e = yearly[year]
            const isAllTimeBest = allTimeBest && e.elapsed_time === allTimeBest.elapsed_time
            return (
              <tr key={year} className={isAllTimeBest ? 'all-time-best-row' : ''}>
                <td className="year-cell">
                  {year}
                  {isAllTimeBest && <span className="pb-badge">PB</span>}
                </td>
                <td className="time-cell">{formatTime(e.elapsed_time)}</td>
                <td className="pace-cell">{formatPace(e.elapsed_time, config.meters)}</td>
                <td className="date-cell">{formatDate(e.date)}</td>
                <td className="name-cell">
                  <a
                    href={`https://www.strava.com/activities/${e.activity_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {e.activity_name}
                  </a>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
