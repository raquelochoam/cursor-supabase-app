/**
 * HorizontalBarChartWidget - Bar chart with layout="vertical" for category axis on Y.
 * Props: data, xKey, yKey, title, color, height
 */
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function HorizontalBarChartWidget({
  data,
  xKey,
  yKey,
  title,
  color = '#4F46E5',
  height = 280,
}) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      {title && <h3>{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey={xKey} domain={[0, 100]} />
          <YAxis type="category" dataKey={yKey} width={140} />
          <Tooltip />
          <Bar dataKey={xKey} fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

