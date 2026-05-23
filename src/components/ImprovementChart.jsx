import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Dot, Scatter, ScatterChart, ZAxis
} from 'recharts'
import { formatTime, formatShortDate, computePbHistory } from '../utils/formatters.js'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-time">{formatTime(d.elapsed_time)}</div>
      <div className="chart-tooltip-date">{formatShortDate(d.date)}</div>
      <div className="chart-tooltip-name">{d.activity_name}</div>
      {d.is_pb && <div className="chart-tooltip-pb">PB at this date</div>}
    </div>
  )
}

function PbDot(props) {
  const { cx, cy, payload } = props
  if (!payload.is_pb) return null
  return <circle cx={cx} cy={cy} r={5} fill="var(--accent)" stroke="white" strokeWidth={2} />
}

function RegularDot(props) {
  const { cx, cy, payload } = props
  if (payload.is_pb) return null
  return <circle cx={cx} cy={cy} r={3} fill="var(--muted)" opacity={0.6} />
}

export default function ImprovementChart({ efforts, config }) {
  if (!efforts?.length) return null

  const history = computePbHistory(efforts)
  const chartData = history.map((e, i) => ({
    ...e,
    index: i,
    timestamp: new Date(e.date).getTime(),
    is_pb: e.elapsed_time === e.pb_at_time,
    display_time: -e.elapsed_time,
    display_pb: -e.pb_at_time,
  }))

  const allTimes = chartData.map(d => d.elapsed_time)
  const minTime = Math.min(...allTimes)
  const maxTime = Math.max(...allTimes)
  const padding = (maxTime - minTime) * 0.1 || 30

  const yDomain = [-(maxTime + padding), -(minTime - padding)]

  const tickFormatter = (val) => formatTime(-val)

  const dateTickFormatter = (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
  }

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={dateTickFormatter}
            tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            tickLine={false}
          />
          <YAxis
            dataKey="display_time"
            domain={yDomain}
            tickFormatter={tickFormatter}
            tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            dataKey="display_time"
            stroke="var(--border)"
            strokeWidth={0}
            dot={<RegularDot />}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="display_pb"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={<PbDot />}
            activeDot={{ r: 6, fill: 'var(--accent)' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="chart-legend">
        <span className="legend-dot pb" /> PB at that date &nbsp;
        <span className="legend-dot other" /> Other effort
      </p>
    </div>
  )
}
