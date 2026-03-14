/**
 * DataExplorer - Raw data table with filters.
 * Purpose: View and export data from Supabase.
 * Modify: Change TABLE_NAME, columns, filters, or export format.
 */
import { useState, useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import FilterBar from '../components/ui/FilterBar'
import DataTable from '../components/ui/DataTable'
import LoadingSpinner from '../components/ui/LoadingSpinner'

// TODO: Replace with your Supabase table name
const TABLE_NAME = 'students'

// TODO: Define columns matching your table. { key, label, sortable }
const COLUMNS = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'value', label: 'Value', sortable: true },
  { key: 'created_at', label: 'Created', sortable: true },
]

// TODO: Configure filters to match your schema
const FILTER_CONFIG = [
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: '', label: 'All' },
      { value: 'A', label: 'A' },
      { value: 'B', label: 'B' },
      { value: 'C', label: 'C' },
    ],
  },
]

function exportToCSV(data, columns, filename = 'export.csv') {
  const headers = columns.map((c) => c.label).join(',')
  const rows = data.map((row) =>
    columns.map((c) => {
      const v = row[c.key]
      return typeof v === 'string' && v.includes(',') ? `"${v}"` : v
    }).join(',')
  )
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function DataExplorer() {
  const [filterState, setFilterState] = useState({})
  const filters = useMemo(() => {
    const f = {}
    Object.entries(filterState).forEach(([k, v]) => {
      if (v != null && v !== '') f[k] = v
    })
    return f
  }, [filterState])

  const { data, loading, error, refetch } = useSupabase(TABLE_NAME, filters)

  if (error) {
    return (
      <div>
        Error loading data: {error.message}. Check Supabase config and table name.
      </div>
    )
  }

  return (
    <div>
      <header style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Data Explorer</h1>
        <button
          onClick={() => exportToCSV(data, COLUMNS)}
          disabled={loading || !data.length}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Export CSV
        </button>
      </header>

      <FilterBar filters={FILTER_CONFIG} onChange={setFilterState} />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable data={data} columns={COLUMNS} pageSize={10} />
      )}
    </div>
  )
}
