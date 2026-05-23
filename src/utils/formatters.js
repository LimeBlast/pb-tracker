export function formatTime(seconds) {
  if (seconds == null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatPace(seconds, meters) {
  if (!seconds || !meters) return '—'
  const secPerKm = (seconds / meters) * 1000
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}:${String(sec).padStart(2, '0')} /km`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

export function getYear(dateStr) {
  return dateStr ? dateStr.slice(0, 4) : null
}

export function computePbHistory(efforts) {
  if (!efforts?.length) return []
  const sorted = [...efforts].sort((a, b) => a.date.localeCompare(b.date))
  let best = Infinity
  return sorted.map(e => {
    if (e.elapsed_time < best) best = e.elapsed_time
    return { ...e, pb_at_time: best }
  })
}

export function computeAllTimeBest(efforts) {
  if (!efforts?.length) return null
  return efforts.reduce((best, e) => (e.elapsed_time < best.elapsed_time ? e : best))
}

export function computeYearlyBests(efforts) {
  if (!efforts?.length) return {}
  return efforts.reduce((acc, e) => {
    const year = getYear(e.date)
    if (!year) return acc
    if (!acc[year] || e.elapsed_time < acc[year].elapsed_time) {
      acc[year] = e
    }
    return acc
  }, {})
}
