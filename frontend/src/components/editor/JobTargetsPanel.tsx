import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useResumeStore } from '../../stores/resumeStore'
import { Input, Textarea } from '../ui'

export function JobTargetsPanel() {
  const {
    jobDescription,
    setJobDescription,
    jobTargets,
    activeJobTargetId,
    saveJobTarget,
    selectJobTarget,
    deleteJobTarget,
  } = useResumeStore()

  const [targetName, setTargetName] = useState('')

  const activeTarget = useMemo(
    () => jobTargets.find(target => target.id === activeJobTargetId) ?? null,
    [jobTargets, activeJobTargetId]
  )

  const onSave = () => {
    if (!targetName.trim()) {
      toast.error('Name this target role before saving')
      return
    }
    if (!jobDescription.trim()) {
      toast.error('Add a job description before saving')
      return
    }
    saveJobTarget(targetName)
    toast.success(activeTarget ? 'Job target updated' : 'Job target saved')
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 12 }}>
      <div className="card" style={{ padding: 14 }}>
        <div className="section-title">Target Job</div>
        <div style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>
          Save multiple target roles and switch between them while tailoring your resume.
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <Input
            label="Target Name"
            value={targetName}
            onChange={event => setTargetName(event.target.value)}
            placeholder="Senior Frontend Engineer"
          />
          <Textarea
            label="Job Description"
            value={jobDescription}
            onChange={event => setJobDescription(event.target.value)}
            placeholder="Paste the full role description to improve ATS matching and recommendations..."
            style={{ minHeight: 170 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn btn-primary btn-sm" onClick={onSave}>Save Target</button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setJobDescription('')
              setTargetName('')
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="section-title">Saved Targets</div>
        {jobTargets.length === 0 ? (
          <div style={{ fontSize: 12, color: '#71717a' }}>No saved targets yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {jobTargets.map(target => {
              const isActive = target.id === activeJobTargetId
              return (
                <div
                  key={target.id}
                  style={{
                    border: `1px solid ${isActive ? '#6c63ff' : '#2a2a3a'}`,
                    borderRadius: 9,
                    padding: 10,
                    background: isActive ? 'rgba(108, 99, 255, 0.08)' : '#0f0f16',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7' }}>{target.name}</div>
                      <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
                        {target.description.slice(0, 120)}{target.description.length > 120 ? '...' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => selectJobTarget(target.id)}>Use</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => deleteJobTarget(target.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
