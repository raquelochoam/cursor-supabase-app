/**
 * DataTable - Paginated, sortable data table with search.
 * Purpose: Display tabular data with filtering and pagination.
 * Modify: Add column formatting, row actions, or export.
 */
import { useState, useMemo } from 'react'
import styles from './DataTable.module.css'

export default function DataTable({ data = [], columns = [], pageSize = 10, pageSizeOptions = [10, 25, 50] }) {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [rowsPerPage, setRowsPerPage] = useState(pageSize)

  const filteredData = useMemo(() => {
    if (!search) return data
    const s = search.toLowerCase()
    return data.filter((row) =>
      columns.some((c) => {
        const v = row[c.key]
        return v != null && String(v).toLowerCase().includes(s)
      })
    )
  }, [data, search, columns])

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortAsc ? cmp : -cmp
    })
  }, [filteredData, sortKey, sortAsc])

  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1
  const start = page * rowsPerPage
  const rows = sortedData.slice(start, start + rowsPerPage)

  const handleSort = (key) => {
    const col = columns.find((c) => c.key === key)
    if (col?.sortable === false) return
    setSortKey(key)
    setSortAsc(sortKey === key ? !sortAsc : true)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          className={styles.search}
        />
        <span className={styles.count}>
          {sortedData.length} row{sortedData.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => {
                const sortable = col.sortable !== false
                return (
                  <th
                    key={col.key}
                    onClick={() => sortable && handleSort(col.key)}
                    className={sortable ? styles.sortable : ''}
                  >
                    {col.label}
                    {sortKey === col.key && (sortAsc ? ' ↑' : ' ↓')}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.empty}>
                  No data available.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.cellClassName || ''}>
                      {typeof col.render === 'function' ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination}>
        <div className={styles.pageSize}>
          <label>
            Filas por página:{' '}
            <select
              value={rowsPerPage}
              onChange={(e) => {
                const value = Number(e.target.value)
                setRowsPerPage(value)
                setPage(0)
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.pageControls}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            ← Anterior
          </button>
          <span>
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  )
}
