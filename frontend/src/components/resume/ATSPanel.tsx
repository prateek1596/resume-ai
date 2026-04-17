import { useResumeStore } from '../../stores/resumeStore'
import type { ATSSuggestion } from '../../types/resume'

const CIRCUMFERENCE = 2 * Math.PI * 28 // r=28

function scoreColor(score: number) {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function scoreLabel(score: number) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Work'
}

const SUGGESTION_STYLES: Record<string, { bg: string; color: string; icon: string }> = {
  add:     { bg: 'rgba(34,197,94,0.08)',   color: '#86efac', icon: '✚' },
  remove:  { bg: 'rgba(239,68,68,0.08)',   color: '#fca5a5', icon: '✕' },
  improve: { bg: 'rgba(245,158,11,0.08)',  color: '#fcd34d', icon: '↑' },
}

const PRIORITY_BADGE: Record<string, string> = {
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#22c55e',
}

export function ATSPanel() {
  const { ats } = useResumeStore()

  if (!ats) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', padding: '40px 20px', color: '#52525b' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
        <div style={{ fontSize: 14, color: '#71717a', marginBottom: 6 }}>No analysis yet</div>
        <div style={{ fontSize: 12 }}>Generate your resume to get a detailed ATS score and improvement suggestions.</div>
      </div>
    )
  }

  const offset = CIRCUMFERENCE - (ats.score / 100) * CIRCUMFERENCE
  const color = scoreColor(ats.score)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Score ring */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
            <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="28" fill="none" stroke="#2a2a3a" strokeWidth="7" />
              <circle
                cx="40" cy="40" r="28" fill="none"
                stroke={color} strokeWidth="7"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="ats-ring"
                style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'DM Serif Display, serif' }}>{ats.score}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color, fontFamily: 'DM Serif Display, serif' }}>{scoreLabel(ats.score)}</div>
            <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>ATS Compatibility Score</div>
            <div style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>{ats.suggestions.length} suggestions</div>
          </div>
        </div>

        {/* Breakdown */}
        {Object.keys(ats.breakdown).length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(ats.breakdown).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#71717a', width: 110, textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                <div style={{ flex: 1, height: 4, background: '#22222f', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${val}%`, background: scoreColor(val), borderRadius: 2, transition: 'width 0.6s ease-out' }} />
                </div>
                <span style={{ fontSize: 11, color: '#71717a', width: 28, textAlign: 'right' }}>{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keywords */}
      {(ats.matched_keywords.length > 0 || ats.missing_keywords.length > 0) && (
        <div className="card" style={{ padding: 14 }}>
          {ats.matched_keywords.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, marginBottom: 6 }}>✓ Matched Keywords</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {ats.matched_keywords.map(k => (
                  <span key={k} style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', padding: '2px 8px', borderRadius: 9999, fontSize: 11 }}>{k}</span>
                ))}
              </div>
            </div>
          )}
          {ats.missing_keywords.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#f87171', fontWeight: 600, marginBottom: 6 }}>✕ Missing Keywords</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {ats.missing_keywords.map(k => (
                  <span key={k} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '2px 8px', borderRadius: 9999, fontSize: 11 }}>{k}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="section-title">Suggestions</div>
        {ats.suggestions.map((s, i) => <SuggestionCard key={i} s={s} />)}
      </div>
    </div>
  )
}

function SuggestionCard({ s }: { s: ATSSuggestion }) {
  const style = SUGGESTION_STYLES[s.type] ?? SUGGESTION_STYLES.improve
  return (
    <div style={{ background: style.bg, borderRadius: 8, padding: '9px 11px', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
      <span style={{ color: style.color, fontSize: 14, flexShrink: 0, marginTop: 1 }}>{style.icon}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 12, color: style.color, lineHeight: 1.5 }}>{s.text}</span>
      </div>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_BADGE[s.priority] ?? '#888', flexShrink: 0, marginTop: 5 }} title={s.priority} />
    </div>
  )
}
