/**
 * Dashboard - EduInsights main dashboard.
 * Purpose: Executive overview with KPIs and charts based on the `students` table.
 */
import {
  PieChartWidget,
  HorizontalBarChartWidget,
  GroupedBarChartWidget,
  CategoryScatterChartWidget,
} from '../components/charts'
import KpiCard from '../components/ui/KpiCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useSupabase } from '../hooks/useSupabase'
import { aggregateByKey } from '../utils/dataTransformers'
import styles from './Dashboard.module.css'

const APP_CONFIG = {
  title: 'EduInsights',
  tableName: 'students',
}

function formatNumber(value, decimals = 0) {
  if (value == null || Number.isNaN(value)) return '-'
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  })
}

export default function Dashboard() {
  const { data, loading, error, refetch } = useSupabase(APP_CONFIG.tableName)

  const totalStudents = data.length

  const mathAverage =
    totalStudents > 0
      ? data.reduce((sum, row) => sum + (row.math_score || 0), 0) / totalStudents
      : null

  const passRate =
    totalStudents > 0
      ? (data.reduce((sum, row) => sum + (row.pass_math || 0), 0) / totalStudents) * 100
      : null

  const prepGroups = data.reduce(
    (acc, row) => {
      const key = row.test_prep === 'completed' ? 'completed' : 'none'
      acc[key].sum += row.math_score || 0
      acc[key].count += 1
      return acc
    },
    {
      completed: { sum: 0, count: 0 },
      none: { sum: 0, count: 0 },
    }
  )

  const avgCompleted =
    prepGroups.completed.count > 0 ? prepGroups.completed.sum / prepGroups.completed.count : null
  const avgNone = prepGroups.none.count > 0 ? prepGroups.none.sum / prepGroups.none.count : null
  const prepImpact = avgCompleted != null && avgNone != null ? avgCompleted - avgNone : null

  const approvalColor = passRate != null && passRate > 60 ? 'success' : 'danger'

  const kpis = [
    {
      title: 'Promedio Matemáticas',
      value: mathAverage != null ? formatNumber(mathAverage, 1) : '-',
      subtitle: 'sobre 100 puntos',
      icon: '📐',
      color: 'text',
    },
    {
      title: 'Tasa de Aprobación',
      value: passRate != null ? `${formatNumber(passRate, 1)}%` : '-',
      subtitle: 'estudiantes con score ≥ 60',
      icon: '✅',
      color: approvalColor,
    },
    {
      title: 'Mejora con Prep Course',
      value: prepImpact != null ? `+${formatNumber(prepImpact, 1)} pts` : '-',
      subtitle: 'vs estudiantes sin preparación',
      icon: '📚',
      color: 'success',
    },
    {
      title: 'Total Estudiantes',
      value: totalStudents ? formatNumber(totalStudents) : '-',
      subtitle: 'en el dataset',
      icon: '👥',
      color: 'text',
    },
  ]

  const educationData = aggregateByKey(data, 'parental_education', 'math_score', 'avg')

  const genderMap = data.reduce((acc, row) => {
    const gender = row.gender || 'N/A'
    if (!acc[gender]) {
      acc[gender] = {
        gender,
        math: 0,
        reading: 0,
        writing: 0,
        count: 0,
      }
    }
    acc[gender].math += row.math_score || 0
    acc[gender].reading += row.reading_score || 0
    acc[gender].writing += row.writing_score || 0
    acc[gender].count += 1
    return acc
  }, {})

  const genderData = Object.values(genderMap).map((g) => ({
    gender: g.gender,
    math: g.count ? g.math / g.count : 0,
    reading: g.count ? g.reading / g.count : 0,
    writing: g.count ? g.writing / g.count : 0,
  }))

  const scatterData = data.map((row) => ({
    reading_score: row.reading_score,
    writing_score: row.writing_score,
    test_prep: row.test_prep,
  }))

  const ethnicityData = aggregateByKey(data, 'ethnicity', 'id', 'count')

  const isEmpty = !loading && !error && data.length === 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard de Rendimiento</h1>
        <p className={styles.subtitle}>Análisis general del dataset de 1,000 estudiantes</p>
        {error && (
          <div className={styles.errorBanner}>
            <span>No se pudo conectar con la base de datos. Verifica tu configuración.</span>
            <div className={styles.errorActions}>
              <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={refetch}>
                Reintentar
              </button>
            </div>
          </div>
        )}
      </header>

      {loading ? (
        <>
          <div className={styles.skeletonGrid}>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
          </div>
          <div className={styles.section}>
            <div className={styles.row}>
              <div className={styles.skeletonChart} />
              <div className={styles.skeletonChart} />
            </div>
            <div className={styles.rowSplit}>
              <div className={styles.skeletonChart} />
              <div className={styles.skeletonChart} />
            </div>
          </div>
        </>
      ) : isEmpty ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📂</div>
          <div className={styles.emptyTitle}>No hay datos disponibles.</div>
          <div className={styles.emptySubtitle}>
            No hay datos disponibles. Carga el dataset para comenzar.
          </div>
        </div>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.kpiGrid}>
              {kpis.map((kpi) => (
                <KpiCard key={kpi.title} {...kpi} />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.row}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Rendimiento por Educación Familiar</h3>
                  <p className={styles.cardSubtitle}>
                    Promedio de math_score agrupado por nivel educativo de los padres
                  </p>
                </div>
                {educationData.length === 0 ? (
                  <LoadingSpinner />
                ) : (
                  <HorizontalBarChartWidget
                    data={educationData}
                    xKey="value"
                    yKey="name"
                    title={null}
                    color="#4F46E5"
                    height={280}
                  />
                )}
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Comparación de Scores por Materia</h3>
                  <p className={styles.cardSubtitle}>
                    Promedio de math, reading y writing por género
                  </p>
                </div>
                {genderData.length === 0 ? (
                  <LoadingSpinner />
                ) : (
                  <GroupedBarChartWidget
                    data={genderData}
                    xKey="gender"
                    series={[
                      { dataKey: 'math', name: 'Matemáticas', color: '#4F46E5' },
                      { dataKey: 'reading', name: 'Lectura', color: '#10B981' },
                      { dataKey: 'writing', name: 'Escritura', color: '#F59E0B' },
                    ]}
                    height={280}
                  />
                )}
              </div>
            </div>

            <div className={styles.rowSplit}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Reading vs Writing Score</h3>
                  <p className={styles.cardSubtitle}>Coloreado por completar curso de preparación</p>
                </div>
                {scatterData.length === 0 ? (
                  <LoadingSpinner />
                ) : (
                  <CategoryScatterChartWidget
                    data={scatterData}
                    xKey="reading_score"
                    yKey="writing_score"
                    categoryKey="test_prep"
                    categories={[
                      { value: 'completed', label: 'Completó prep', color: '#4F46E5' },
                      { value: 'none', label: 'Sin prep', color: '#94A3B8' },
                    ]}
                    height={280}
                  />
                )}
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Distribución por Grupo Étnico</h3>
                  <p className={styles.cardSubtitle}>Porcentaje de estudiantes por grupo</p>
                </div>
                {ethnicityData.length === 0 ? (
                  <LoadingSpinner />
                ) : (
                  <PieChartWidget
                    data={ethnicityData}
                    nameKey="name"
                    valueKey="value"
                    title={null}
                    height={280}
                  />
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
