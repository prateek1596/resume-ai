import { useState } from 'react'
import toast from 'react-hot-toast'
import { resumeApi } from '../../lib/api'
import { useResumeStore } from '../../stores/resumeStore'

export function InsightsPanel() {
  const { resume, jobDescription } = useResumeStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{
    overall_completeness: number
    section_word_counts: Record<string, number>
    strengths: string[]
    gaps: string[]
    recommendations: string[]
  } | null>(null)

  const runInsights = async () => {
    setLoading(true)
    const toastId = toast.loading('Analyzing resume insights...')
    try {
      const response = await resumeApi.getResumeInsights({
        resume_data: resume,
        job_description: jobDescription,
      })
      setData(response)
      toast.success('Insights ready', { id: toastId })
    } catch {
      toast.error('Could not fetch insights', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 12 }}>
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            <div className="section-title">Resume Insights</div>
            <div style={{ fontSize: 12, color: '#71717a' }}>
              Deterministic quality checks for completeness, coverage, and improvement opportunities.
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={runInsights} disabled={loading}>
            {loading ? 'Analyzing...' : 'Run Insights'}
          </button>
        </div>
      </div>

      {data && (
        <>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#a1a1aa' }}>Overall Completeness</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#6c63ff' }}>{data.overall_completeness}%</span>
            </div>
            <div style={{ marginTop: 8, height: 6, borderRadius: 999, background: '#22222f', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${data.overall_completeness}%`,
                  background: '#6c63ff',
                  height: '100%',
                  borderRadius: 999,
                }}
              />
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="section-title">Section Word Counts</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {Object.entries(data.section_word_counts).map(([section, count]) => (
                <div key={section} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#a1a1aa', textTransform: 'capitalize' }}>{section}</span>
                  <span style={{ color: '#e4e4e7' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <ListCard title="Strengths" items={data.strengths} color="#4ade80" />
          <ListCard title="Gaps" items={data.gaps} color="#f87171" />
          <ListCard title="Recommendations" items={data.recommendations} color="#fbbf24" />
        </>
      )}
    </div>
  )
}

function ListCard({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="section-title">{title}</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: '#71717a' }}>No items.</div>
      ) : (
        <div style={{ display: 'grid', gap: 7 }}>
          {items.map(item => (
            <div
              key={item}
              style={{
                fontSize: 12,
                color: '#d4d4d8',
                borderLeft: `2px solid ${color}`,
                paddingLeft: 10,
                lineHeight: 1.55,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
