import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { AxiosError } from 'axios'
import { useResumeStore } from '../../stores/resumeStore'
import { resumeApi } from '../../lib/api'
import { Tabs, Spinner } from '../ui'

interface UploadPanelProps {
  onImported: () => void
}

export function UploadPanel({ onImported }: UploadPanelProps) {
  const [tab, setTab] = useState('linkedin')
  const { setExtracting, isExtracting, importResume, setJobDescription, jobDescription } = useResumeStore()

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof AxiosError) {
      const detail = err.response?.data as { detail?: string } | undefined
      return detail?.detail ?? 'Extraction failed'
    }
    return 'Extraction failed'
  }

  const processFile = useCallback(async (file: File) => {
    setExtracting(true)
    const tid = toast.loading(`Extracting from ${file.name}…`)
    try {
      const res = await resumeApi.extractFile(file)
      importResume(res.resume_data)
      toast.success(`Profile imported from ${res.source}!`, { id: tid })
      onImported()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err), { id: tid })
    } finally {
      setExtracting(false)
    }
  }, [setExtracting, importResume, onImported])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: files => files[0] && processFile(files[0]),
    accept: { 'application/pdf': ['.pdf'], 'application/zip': ['.zip'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] },
    multiple: false,
    disabled: isExtracting,
  })

  return (
    <div className="fade-in">
      <Tabs
        tabs={[{ id: 'linkedin', label: 'LinkedIn' }, { id: 'resume', label: 'Resume/CV' }, { id: 'manual', label: 'Manual' }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'linkedin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            {...getRootProps()}
            className={`dashed-zone${isDragActive ? ' dragging' : ''}`}
            style={{ opacity: isExtracting ? 0.6 : 1 }}
          >
            <input {...getInputProps()} />
            {isExtracting ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Spinner size={28} />
                <p style={{ fontSize: 13, color: '#71717a' }}>Extracting your profile…</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
                <strong style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Upload LinkedIn Export</strong>
                <p style={{ fontSize: 12, color: '#71717a' }}>
                  Drag &amp; drop your LinkedIn PDF or ZIP, or click to browse
                </p>
              </>
            )}
          </div>

          <div style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, padding: '10px 12px' }}>
            <p style={{ fontSize: 11, color: '#52525b', lineHeight: 1.6 }}>
              <strong style={{ color: '#71717a' }}>How to export:</strong> LinkedIn → Me → Settings &amp; Privacy → Data Privacy → Get a copy of your data → select "Profile" → Request archive
            </p>
          </div>

          <div>
            <label className="label">Job Description (optional — improves ATS matching)</label>
            <textarea
              className="input"
              style={{ minHeight: 100 }}
              placeholder="Paste the job description here to tailor keywords and get precise ATS scoring…"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
            />
          </div>
        </div>
      )}

      {tab === 'resume' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            {...getRootProps()}
            className={`dashed-zone${isDragActive ? ' dragging' : ''}`}
          >
            <input {...getInputProps()} />
            {isExtracting ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Spinner size={28} />
                <p style={{ fontSize: 13, color: '#71717a' }}>Reading your resume…</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                <strong style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Upload Existing Resume</strong>
                <p style={{ fontSize: 12, color: '#71717a' }}>PDF, DOCX, or TXT — we'll extract and improve it</p>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#1a1a24', borderRadius: 10, padding: '16px', border: '1px solid #2a2a3a', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✍️</div>
            <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6 }}>
              Fill in your details manually in the <strong style={{ color: '#e4e4e7' }}>Edit</strong> tab. Start with your basics, then add experience and skills.
            </p>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onImported}>
            Go to Editor →
          </button>
        </div>
      )}
    </div>
  )
}
