/**
 * CategoryScatterChartWidget - Scatter plot with points colored by category.
 * Props: data, xKey, yKey, categoryKey, categories (array of { value, label, color }), height
 */
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function CategoryScatterChartWidget({
  data,
  xKey,
  yKey,
  categoryKey,
  categories = [],
  height = 280,
}) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </div>
    )
  }

  const byCategory = {}
  data.forEach((row) => {
    const cat = row[categoryKey]
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push({ x: row[xKey], y: row[yKey], ...row })
  })

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" name={xKey} />
          <YAxis dataKey="y" name={yKey} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          {categories.map((cat) => (
            <Scatter
              key={cat.value}
              name={cat.label}
              data={byCategory[cat.value] || []}
              fill={cat.color}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

