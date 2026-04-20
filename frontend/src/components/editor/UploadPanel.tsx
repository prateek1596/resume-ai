import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { AxiosError } from 'axios'
import { useResumeStore } from '../../stores/resumeStore'
import { resumeApi } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { Tabs, Spinner } from '../ui'

interface UploadPanelProps {
  onImported: () => void
}

export function UploadPanel({ onImported }: UploadPanelProps) {
  const [tab, setTab] = useState('linkedin')
  const [targetName, setTargetName] = useState('')
  const [profileName, setProfileName] = useState('')
  const [savedProfiles, setSavedProfiles] = useState<Array<{ id: string; name: string; updated_at: string }>>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const {
    setExtracting,
    isExtracting,
    importResume,
    setJobDescription,
    jobDescription,
    jobTargets,
    activeJobTargetId,
    saveJobTarget,
    selectJobTarget,
    deleteJobTarget,
    starterProfiles,
    loadStarterProfile,
    loadWorkspace,
    resume,
    templateId,
    colorScheme,
  } = useResumeStore()
  const { isAuthenticated } = useAuthStore()

  const refreshProfiles = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedProfiles([])
      return
    }
    setLoadingProfiles(true)
    try {
      const profiles = await resumeApi.listProfiles()
      setSavedProfiles(profiles)
    } catch {
      setSavedProfiles([])
    } finally {
      setLoadingProfiles(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (tab === 'manual') {
      refreshProfiles()
    }
  }, [tab, refreshProfiles])

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

          <div style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 10, padding: 12, display: 'grid', gap: 10 }}>
            <div>
              <label className="label">Save Job Target</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={targetName}
                  onChange={e => setTargetName(e.target.value)}
                />
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    saveJobTarget(targetName)
                    if (jobDescription.trim()) {
                      setTargetName('')
                    }
                  }}
                  disabled={!targetName.trim() || !jobDescription.trim()}
                >
                  Save
                </button>
              </div>
            </div>

            {jobTargets.length > 0 && (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 11, color: '#71717a', fontWeight: 600 }}>Saved Targets</div>
                {jobTargets.map(target => (
                  <div
                    key={target.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: activeJobTargetId === target.id ? 'rgba(108,99,255,0.12)' : '#111118',
                      border: `1px solid ${activeJobTargetId === target.id ? '#6c63ff' : '#2a2a3a'}`,
                    }}
                  >
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, justifyContent: 'flex-start', padding: '0 6px' }}
                      onClick={() => selectJobTarget(target.id)}
                    >
                      {target.name}
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => deleteJobTarget(target.id)}
                      title="Delete target"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
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
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 11, color: '#71717a', fontWeight: 600 }}>Starter Profiles</div>
            {starterProfiles.map(profile => (
              <button
                key={profile.id}
                className="btn btn-ghost"
                style={{ justifyContent: 'space-between', width: '100%' }}
                onClick={() => {
                  loadStarterProfile(profile.id)
                  onImported()
                }}
              >
                <span>{profile.name}</span>
                <span style={{ fontSize: 11, color: '#71717a' }}>{profile.title}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 8, background: '#1a1a24', borderRadius: 10, padding: 12, border: '1px solid #2a2a3a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: '#71717a', fontWeight: 600 }}>Saved Profiles (Cloud)</div>
              <button className="btn btn-ghost btn-sm" onClick={refreshProfiles} disabled={!isAuthenticated || loadingProfiles}>
                {loadingProfiles ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {isAuthenticated ? (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    placeholder="Profile name"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={!profileName.trim()}
                    onClick={async () => {
                      const tid = toast.loading('Saving profile…')
                      try {
                        await resumeApi.createProfile({
                          name: profileName.trim(),
                          resume_data: resume,
                          template_id: templateId,
                          color_scheme: colorScheme,
                          job_description: jobDescription,
                        })
                        setProfileName('')
                        await refreshProfiles()
                        toast.success('Profile saved', { id: tid })
                      } catch (err: unknown) {
                        toast.error(getErrorMessage(err), { id: tid })
                      }
                    }}
                  >
                    Save
                  </button>
                </div>

                {savedProfiles.length > 0 ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {savedProfiles.map(profile => (
                      <div key={profile.id} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #2a2a3a', borderRadius: 8, padding: '8px 10px' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, justifyContent: 'flex-start' }}
                          onClick={async () => {
                            const tid = toast.loading('Loading profile…')
                            try {
                              const detail = await resumeApi.getProfile(profile.id)
                              loadWorkspace(detail)
                              onImported()
                              toast.success('Profile loaded', { id: tid })
                            } catch (err: unknown) {
                              toast.error(getErrorMessage(err), { id: tid })
                            }
                          }}
                        >
                          {profile.name}
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Delete profile"
                          onClick={async () => {
                            const tid = toast.loading('Deleting profile…')
                            try {
                              await resumeApi.deleteProfile(profile.id)
                              await refreshProfiles()
                              toast.success('Profile deleted', { id: tid })
                            } catch (err: unknown) {
                              toast.error(getErrorMessage(err), { id: tid })
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#71717a' }}>No saved profiles yet.</div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#71717a' }}>Sign in to save and load profiles from the database.</div>
            )}
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onImported}>
            Go to Editor →
          </button>
        </div>
      )}
    </div>
  )
}
