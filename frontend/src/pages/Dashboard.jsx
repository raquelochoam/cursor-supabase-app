/**
 * Dashboard - Main dashboard page.
 * Purpose: Overview KPIs and charts. Uses placeholder data until Supabase is connected.
 * Modify: Replace TODO sections with real useSupabase calls.
 */
import {
  BarChartWidget,
  LineChartWidget,
  PieChartWidget,
  ScatterChartWidget,
} from '../components/charts'
import KpiCard from '../components/ui/KpiCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useSupabase } from '../hooks/useSupabase'
import { aggregateByKey, formatForPieChart } from '../utils/dataTransformers'

// TODO: Define these in a config file or env. Use your actual Supabase table name.
const APP_CONFIG = {
  title: import.meta.env.VITE_APP_TITLE || 'Data App',
  tableName: 'students', // Replace with your Supabase table name
}

// Placeholder data for layout before real data is connected
const MOCK_KPIS = [
  { title: 'Total Items', value: '1,234', subtitle: 'Last 30 days', icon: '📊', trend: 12.5 },
  { title: 'Revenue', value: '$12,450', subtitle: 'This month', icon: '💰', trend: -2.3 },
  { title: 'Active Users', value: '89', subtitle: 'Online now', icon: '👥', trend: 8.1 },
  { title: 'Conversion', value: '4.2%', subtitle: 'Overall', icon: '📈', trend: 0.5 },
]

// TODO: Replace with real data from useSupabase. Mock data for layout demo.
const MOCK_BAR = [
  { category: 'A', value: 120 },
  { category: 'B', value: 200 },
  { category: 'C', value: 150 },
  { category: 'D', value: 80 },
]
const MOCK_LINE = [
  { month: 'Jan', value: 100 },
  { month: 'Feb', value: 120 },
  { month: 'Mar', value: 115 },
  { month: 'Apr', value: 140 },
]
const MOCK_PIE = [
  { name: 'Type A', value: 400 },
  { name: 'Type B', value: 300 },
  { name: 'Type C', value: 200 },
]
const MOCK_SCATTER = [
  { x: 1, y: 10 },
  { x: 2, y: 20 },
  { x: 3, y: 15 },
  { x: 4, y: 25 },
]

export default function Dashboard() {
  // TODO: Uncomment and use when Supabase is connected. Pass filters if needed.
  // const { data, loading, error, refetch } = useSupabase(APP_CONFIG.tableName)

  const loading = false
  const error = null
  const data = []

  // Use mock data if no real data yet
  const barData = data.length ? aggregateByKey(data, 'category', 'value', 'sum') : MOCK_BAR
  const lineData = data.length ? aggregateByKey(data, 'month', 'value', 'avg') : MOCK_LINE
  const pieData = data.length ? formatForPieChart(data, 'name', 'value') : MOCK_PIE
  const scatterData = data.length ? data : MOCK_SCATTER

  if (error) {
    return <div>Error loading data: {error.message}</div>
  }

  return (
    <div>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1>{APP_CONFIG.title} Dashboard</h1>
      </header>

      {/* KPI Cards - TODO: Replace values with real metrics from useSupabase */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {MOCK_KPIS.map((k) => (
          <KpiCard key={k.title} {...k} />
        ))}
      </div>

      {/* Charts - TODO: Replace with useSupabase data and correct keys for your schema */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <BarChartWidget data={barData} xKey="category" yKey="value" title="By Category" />
          <LineChartWidget data={lineData} xKey="month" yKey="value" title="Trend Over Time" />
          <PieChartWidget data={pieData} nameKey="name" valueKey="value" title="Distribution" />
          <ScatterChartWidget data={scatterData} xKey="x" yKey="y" title="Correlation" />
        </div>
      )}
    </div>
  )
}
