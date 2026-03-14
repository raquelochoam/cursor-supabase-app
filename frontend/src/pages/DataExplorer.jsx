import { useState, useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import FilterBar from '../components/ui/FilterBar'
import DataTable from '../components/ui/DataTable'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import styles from './DataExplorer.module.css'

const TABLE_NAME = 'students'
const TOTAL_STUDENTS = 1000

const COLUMNS = (classes) => [
  { key: 'id', label: '#', sortable: true },
  {
    key: 'gender',
    label: 'Género',
    sortable: true,
    render: (value) => {
      const isFemale = value === 'female'
      const label = isFemale ? 'Female' : 'Male'
      const badgeClass = isFemale ? classes.badgeDanger : classes.badgeSuccess
      return <span className={`${classes.badge} ${badgeClass}`}>{label}</span>
    },
  },
  { key: 'ethnicity', label: 'Grupo', sortable: true },
  { key: 'parental_education', label: 'Educ. Parental', sortable: true },
  {
    key: 'lunch',
    label: 'Almuerzo',
    sortable: false,
    render: (value) => {
      let label = '—'
      let variant = classes.badgeNeutral
      if (value === 'standard') {
        label = 'Standard'
        variant = classes.badgeSuccess
      } else if (value === 'free/reduced') {
        label = 'Free/Reduced'
      }
      return <span className={`${classes.badge} ${variant}`}>{label}</span>
    },
  },
  {
    key: 'test_prep',
    label: 'Curso Prep.',
    sortable: true,
    render: (value) => {
      const isCompleted = value === 'completed'
      const label = isCompleted ? 'Completed' : 'None'
      const variant = isCompleted ? classes.badgeSuccess : classes.badgeNeutral
      return <span className={`${classes.badge} ${variant}`}>{label}</span>
    },
  },
  {
    key: 'math_score',
    label: 'Matemáticas',
    sortable: true,
    cellClassName: styles.scoreCell,
    render: (value) => (
      <div>
        <div className={styles.scoreValue}>
          <span>{value ?? '—'}</span>
          <span>/ 100</span>
        </div>
        <div className={styles.scoreBar}>
          <div className={styles.scoreBarInner} style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
        </div>
      </div>
    ),
  },
  {
    key: 'reading_score',
    label: 'Lectura',
    sortable: true,
    cellClassName: styles.scoreCell,
    render: (value) => (
      <div>
        <div className={styles.scoreValue}>
          <span>{value ?? '—'}</span>
          <span>/ 100</span>
        </div>
        <div className={styles.scoreBar}>
          <div className={styles.scoreBarInner} style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
        </div>
      </div>
    ),
  },
  {
    key: 'writing_score',
    label: 'Escritura',
    sortable: true,
    cellClassName: styles.scoreCell,
    render: (value) => (
      <div>
        <div className={styles.scoreValue}>
          <span>{value ?? '—'}</span>
          <span>/ 100</span>
        </div>
        <div className={styles.scoreBar}>
          <div className={styles.scoreBarInner} style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
        </div>
      </div>
    ),
  },
  {
    key: 'pass_math',
    label: 'Resultado',
    sortable: true,
    render: (value) => {
      if (value === 1 || value === '1') {
        return <span className={`${classes.badge} ${classes.badgeSuccess}`}>Aprobó</span>
      }
      if (value === 0 || value === '0') {
        return <span className={`${classes.badge} ${classes.badgeDanger}`}>Reprobó</span>
      }
      return <span className={`${classes.badge} ${classes.badgeNeutral}`}>Sin dato</span>
    },
  },
]

const FILTER_CONFIG = [
  {
    key: 'gender',
    label: 'Género',
    type: 'select',
    options: [
      { value: '', label: 'Todos' },
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
  },
  {
    key: 'parental_education',
    label: 'Educación Parental',
    type: 'select',
    options: [
      { value: '', label: 'Todos' },
      { value: 'some high school', label: 'Some high school' },
      { value: 'high school', label: 'High school' },
      { value: 'some college', label: 'Some college' },
      { value: "associate's degree", label: "Associate's degree" },
      { value: "bachelor's degree", label: "Bachelor's degree" },
      { value: "master's degree", label: "Master's degree" },
    ],
  },
  {
    key: 'test_prep',
    label: 'Curso de Prep.',
    type: 'select',
    options: [
      { value: '', label: 'Todos' },
      { value: 'completed', label: 'Completado' },
      { value: 'none', label: 'No completado' },
    ],
  },
  {
    key: 'math_score',
    label: 'Math Score',
    type: 'range',
    min: 0,
    max: 100,
  },
  {
    key: 'pass_math',
    label: 'Resultado',
    type: 'select',
    options: [
      { value: '', label: 'Todos' },
      { value: '1', label: 'Aprobó' },
      { value: '0', label: 'Reprobó' },
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
  const [draftFilters, setDraftFilters] = useState({})
  const [appliedFilters, setAppliedFilters] = useState({})
  const [filterVersion, setFilterVersion] = useState(0)

  const filtersForSupabase = useMemo(() => {
    const f = {}
    Object.entries(appliedFilters).forEach(([k, v]) => {
      if (v == null || v === '' || (typeof v === 'object' && v.min == null && v.max == null)) return
      f[k] = v
    })
    return f
  }, [appliedFilters])

  const { data, loading, error, refetch } = useSupabase(TABLE_NAME, filtersForSupabase)

  const appliedCount = data.length

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters || {})
  }

  const handleClearFilters = () => {
    setAppliedFilters({})
    setDraftFilters({})
    setFilterVersion((v) => v + 1)
  }

  return (
    <div className={styles.page}>
      {error && (
        <div className={styles.errorBanner}>
          <span>No se pudo conectar con la base de datos. Verifica tu configuración.</span>
          <div className={styles.errorActions}>
            <button className={styles.secondaryButton} onClick={refetch}>
              Reintentar
            </button>
          </div>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Explorador de Datos</h1>
            <p className={styles.subtitle}>Filtra, ordena y exporta el dataset completo</p>
          </div>
          <button
            className={styles.exportButton}
            onClick={() => exportToCSV(data, COLUMNS(styles))}
            disabled={loading || !data.length}
          >
            ⬇ Exportar CSV
          </button>
        </div>
        <p className={styles.summary}>
          Mostrando <span className={styles.summaryHighlight}>{appliedCount}</span> de {TOTAL_STUDENTS} estudiantes
        </p>
      </header>

      <div className={styles.filtersRow}>
        <FilterBar key={filterVersion} filters={FILTER_CONFIG} onChange={setDraftFilters} />
        <div className={styles.filterActions}>
          <button className={styles.secondaryButton} type="button" onClick={handleClearFilters} disabled={loading}>
            Limpiar
          </button>
          <button className={styles.primaryButton} type="button" onClick={handleApplyFilters} disabled={loading}>
            Aplicar filtros
          </button>
        </div>
      </div>

      <div className={styles.actionsBar}>
        <div className={styles.actionsLeft}>
          <span>Resultados</span>
          <span className={styles.badgeCount}>{appliedCount}</span>
        </div>
        <div className={styles.actionsRight}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => exportToCSV(data, COLUMNS(styles))}
            disabled={loading || !data.length}
          >
            ⬇ Exportar CSV
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : appliedCount === 0 ? (
        <div className={styles.noDataState}>
          <p>Ningún estudiante coincide con los filtros aplicados.</p>
          <button className={styles.primaryButton} type="button" onClick={handleClearFilters}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <DataTable data={data} columns={COLUMNS(styles)} pageSize={10} />
      )}
    </div>
  )
}
