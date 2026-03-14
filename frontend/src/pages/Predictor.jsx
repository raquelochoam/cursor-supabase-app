/**
 * Predictor - EduInsights ML predictor page.
 * Purpose: Collects student features, calls the ML API, and displays prediction + confidence,
 * following the PRD "Pantalla 3 — Predictor ML" layout.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMLPredict } from '../hooks/useMLPredict'
import * as mlApi from '../services/mlApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import styles from './Predictor.module.css'

const MAX_HISTORY = 5

const INITIAL_FORM = {
  gender: 'female',
  ethnicity: 'group C',
  parental_education: "bachelor's degree",
  lunch: 'standard',
  test_prep: 'none',
  reading_score: 72,
  writing_score: 68,
}

function formatTime(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function Predictor() {
  const { predict, result, loading, error, reset } = useMLPredict()
  const [form, setForm] = useState(INITIAL_FORM)
  const [apiUnavailable, setApiUnavailable] = useState(false)
  const [history, setHistory] = useState([])
  const lastInputRef = useRef(null)

  // Optional health check for "API no disponible" banner
  useEffect(() => {
    let cancelled = false
    mlApi
      .healthCheck()
      .then(() => {
        if (!cancelled) setApiUnavailable(false)
      })
      .catch(() => {
        if (!cancelled) setApiUnavailable(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleScoreChange = (key, value) => {
    const numeric = Number.isNaN(Number(value)) ? '' : Math.max(0, Math.min(100, Number(value)))
    setForm((prev) => ({ ...prev, [key]: numeric }))
  }

  const handlePredict = async () => {
    lastInputRef.current = form
    await predict(form)
  }

  const handleReset = () => {
    setForm(INITIAL_FORM)
    reset()
  }

  // Add to history when we get a successful result
  useEffect(() => {
    if (!result || loading) return
    const input = lastInputRef.current
    if (input == null) return
    const timestamp = new Date().toISOString()
    setHistory((prev) =>
      [
        {
          timestamp,
          input,
          prediction: result.prediction,
          confidence: result.confidence,
          label: result.label,
        },
        ...prev,
      ].slice(0, MAX_HISTORY)
    )
    lastInputRef.current = null
  }, [result, loading])

  const isPass = useMemo(() => {
    if (!result) return null
    if (result.prediction === 1) return true
    if (result.prediction === 0) return false
    if (typeof result.label === 'string') {
      const lower = result.label.toLowerCase()
      if (lower.includes('aprueba') || lower.includes('pass')) return true
      if (lower.includes('reprueba') || lower.includes('fail') || lower.includes('riesgo')) return false
    }
    return null
  }, [result])

  const confidencePct = result?.confidence != null ? Math.round(result.confidence * 100) : null

  const factorChips = useMemo(
    () => [
      `Género: ${form.gender === 'female' ? 'Femenino' : 'Masculino'}`,
      `Grupo: ${form.ethnicity}`,
      `Educación parental: ${form.parental_education}`,
      `Almuerzo: ${form.lunch === 'standard' ? 'Estándar' : 'Subsidiado'}`,
      `Curso prep.: ${form.test_prep === 'completed' ? 'Completado' : 'No completado'}`,
      `Lectura: ${form.reading_score}`,
      `Escritura: ${form.writing_score}`,
    ],
    [form]
  )

  const canSubmit =
    !loading &&
    form.reading_score !== '' &&
    form.writing_score !== '' &&
    form.reading_score >= 0 &&
    form.reading_score <= 100 &&
    form.writing_score >= 0 &&
    form.writing_score <= 100

  return (
    <div className={styles.page}>
      {apiUnavailable && (
        <div className={styles.apiBanner}>
          El servicio de predicción no está disponible en este momento.
        </div>
      )}

      <header className={styles.header}>
        <h1 className={styles.title}>Predictor de Rendimiento</h1>
        <p className={styles.subtitle}>
          Ingresa los datos del estudiante para predecir si aprobará matemáticas.
        </p>
      </header>

      {error && !apiUnavailable && (
        <div className={styles.errorBanner}>
          {error.message || 'Error al obtener la predicción. Intenta de nuevo.'}
        </div>
      )}

      <div className={styles.layout}>
        {/* Left panel — Formulario */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Datos del Estudiante</h2>
              <p className={styles.cardSubtitle}>Completa las características que usa el modelo de ML.</p>
            </div>
            <div className={styles.cardIcon}>🎓</div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <span>Género</span>
              </div>
              <div className={styles.pills}>
                <button
                  type="button"
                  className={`${styles.pill} ${form.gender === 'male' ? styles.pillSelected : ''}`}
                  onClick={() => handleChange('gender', 'male')}
                >
                  Masculino
                </button>
                <button
                  type="button"
                  className={`${styles.pill} ${form.gender === 'female' ? styles.pillSelected : ''}`}
                  onClick={() => handleChange('gender', 'female')}
                >
                  Femenino
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <span>Grupo Étnico</span>
              </div>
              <select
                className={styles.select}
                value={form.ethnicity}
                onChange={(e) => handleChange('ethnicity', e.target.value)}
              >
                <option value="group A">Group A</option>
                <option value="group B">Group B</option>
                <option value="group C">Group C</option>
                <option value="group D">Group D</option>
                <option value="group E">Group E</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <span>Nivel Educativo de los Padres</span>
              </div>
              <select
                className={styles.select}
                value={form.parental_education}
                onChange={(e) => handleChange('parental_education', e.target.value)}
              >
                <option value="some high school">Some high school</option>
                <option value="high school">High school</option>
                <option value="some college">Some college</option>
                <option value="associate's degree">Associate&apos;s degree</option>
                <option value="bachelor's degree">Bachelor&apos;s degree</option>
                <option value="master's degree">Master&apos;s degree</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <span>Tipo de Almuerzo</span>
                <span className={styles.tooltip}>Indicador de nivel socioeconómico</span>
              </div>
              <div className={styles.pills}>
                <button
                  type="button"
                  className={`${styles.pill} ${form.lunch === 'standard' ? styles.pillSelected : ''}`}
                  onClick={() => handleChange('lunch', 'standard')}
                >
                  Estándar
                </button>
                <button
                  type="button"
                  className={`${styles.pill} ${form.lunch === 'free/reduced' ? styles.pillSelected : ''}`}
                  onClick={() => handleChange('lunch', 'free/reduced')}
                >
                  Subsidiado
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <span>Completó Curso de Preparación</span>
              </div>
              <div
                className={styles.toggleWrapper}
                onClick={() =>
                  handleChange('test_prep', form.test_prep === 'completed' ? 'none' : 'completed')
                }
              >
                <div
                  className={`${styles.toggleTrack} ${
                    form.test_prep === 'completed' ? styles.toggleTrackOn : ''
                  }`}
                >
                  <div
                    className={`${styles.toggleThumb} ${
                      form.test_prep === 'completed' ? styles.toggleThumbOn : ''
                    }`}
                  />
                </div>
                <span className={styles.toggleLabel}>
                  {form.test_prep === 'completed' ? 'Completado' : 'No completado'}
                </span>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <span>Score de Lectura</span>
              </div>
              <div className={styles.scoreRow}>
                <div className={styles.scoreInputs}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={styles.scoreNumber}
                    value={form.reading_score}
                    onChange={(e) => handleScoreChange('reading_score', e.target.value)}
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    className={styles.scoreSlider}
                    value={form.reading_score}
                    onChange={(e) => handleScoreChange('reading_score', e.target.value)}
                  />
                </div>
                <span className={styles.scoreHint}>Rango 0–100</span>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <span>Score de Escritura</span>
              </div>
              <div className={styles.scoreRow}>
                <div className={styles.scoreInputs}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={styles.scoreNumber}
                    value={form.writing_score}
                    onChange={(e) => handleScoreChange('writing_score', e.target.value)}
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    className={styles.scoreSlider}
                    value={form.writing_score}
                    onChange={(e) => handleScoreChange('writing_score', e.target.value)}
                  />
                </div>
                <span className={styles.scoreHint}>Rango 0–100</span>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handlePredict}
              disabled={!canSubmit}
            >
              {loading ? (
                <>
                  <LoadingSpinner /> Analizando...
                </>
              ) : (
                <>
                  <span>▶</span> <span>Predecir Resultado</span>
                </>
              )}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleReset} disabled={loading}>
              Limpiar
            </button>
          </div>
        </section>

        {/* Right panel — Resultado + Historial */}
        <section>
          <div className={`${styles.card} ${styles.resultCard}`}>
            {!result && !loading && !error ? (
              <div className={styles.resultEmpty}>
                <div className={styles.resultIcon}>📊</div>
                <div className={styles.resultText}>
                  Completa el formulario y presiona <strong>Predecir</strong> para ver el resultado.
                </div>
              </div>
            ) : loading ? (
              <div className={styles.resultEmpty}>
                <LoadingSpinner />
                <div className={styles.resultText}>Consultando el modelo...</div>
              </div>
            ) : (
              result && (
                <>
                  <div
                    className={styles.resultHeader}
                    style={{
                      borderLeft: `4px solid ${
                        isPass === false ? '#ef4444' : isPass === true ? '#10b981' : '#4b5563'
                      }`,
                      paddingLeft: '0.75rem',
                    }}
                  >
                    <div>
                      <span
                        className={`${styles.resultBadge} ${
                          isPass === false ? styles.resultBadgeFail : styles.resultBadgePass
                        }`}
                      >
                        {isPass === false ? '⚠️ EN RIESGO' : '✅ APRUEBA'}
                      </span>
                      <p className={styles.resultLabel}>
                        {isPass === false
                          ? 'El modelo predice que este estudiante podría reprobar matemáticas.'
                          : 'El modelo predice que este estudiante aprobará matemáticas.'}
                      </p>
                    </div>
                  </div>

                  {confidencePct != null && (
                    <div className={styles.confidenceWrapper}>
                      <div className={styles.confidenceHeader}>
                        <span>Confianza del modelo</span>
                        <span>{confidencePct}%</span>
                      </div>
                      <div className={styles.confidenceBarOuter}>
                        <div
                          className={`${styles.confidenceBarInner} ${
                            isPass === false ? styles.confidenceBarFail : styles.confidenceBarPass
                          }`}
                          style={{ width: `${confidencePct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className={styles.factors}>
                    <div className={styles.factorsTitle}>Factores considerados</div>
                    <ul className={styles.factorsList}>
                      {factorChips.map((chip) => (
                        <li key={chip} className={styles.factorChip}>
                          {chip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )
            )}
          </div>

          <div className={`${styles.card} ${styles.historyCard}`}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Últimas Predicciones</h2>
                <p className={styles.cardSubtitle}>Máximo {MAX_HISTORY} durante esta sesión.</p>
              </div>
            </div>
            {history.length === 0 ? (
              <p className={styles.historyEmpty}>Las predicciones de esta sesión aparecerán aquí.</p>
            ) : (
              <ul className={styles.historyList}>
                {history.map((h, index) => (
                  <li key={index} className={styles.historyItem}>
                    <div className={styles.historyMeta}>
                      <span className={styles.historyTime}>{formatTime(h.timestamp)}</span>
                      <span
                        className={`${styles.resultBadge} ${
                          h.prediction === 1 ? styles.resultBadgePass : styles.resultBadgeFail
                        }`}
                      >
                        {h.prediction === 1 ? 'Aprueba' : 'En riesgo'}
                      </span>
                    </div>
                    <div className={styles.historySummary}>
                      {h.input.gender === 'female' ? 'Femenino' : 'Masculino'},{' '}
                      {h.input.ethnicity}, Prep:{' '}
                      {h.input.test_prep === 'completed' ? 'Completado' : 'No completado'},{' '}
                      Lect {h.input.reading_score}, Escr {h.input.writing_score}
                      {h.confidence != null && ` · ${(h.confidence * 100).toFixed(1)}% conf.`}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className={styles.infoCard}>
        <h2 className={styles.infoTitle}>ℹ️ ¿Cómo funciona este modelo?</h2>
        <p className={styles.infoText}>
          Este predictor usa un modelo de Random Forest entrenado con datos de 1,000 estudiantes. Analiza 7
          características para estimar la probabilidad de aprobar matemáticas (score ≥ 60). La confianza indica qué
          tan seguro está el modelo — valores sobre 75% son considerados confiables.
        </p>
      </section>
    </div>
  )
}
