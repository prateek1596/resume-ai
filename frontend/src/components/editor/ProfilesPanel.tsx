import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { resumeApi, type SavedProfileSummary } from '../../lib/api'
import { useResumeStore } from '../../stores/resumeStore'
import { Input } from '../ui'

export function ProfilesPanel() {
  const { resume, templateId, colorScheme, jobDescription, loadWorkspace } = useResumeStore()
  const [profiles, setProfiles] = useState<SavedProfileSummary[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileName, setProfileName] = useState('')

  const refreshProfiles = async () => {
    setLoading(true)
    try {
      const data = await resumeApi.listProfiles()
      setProfiles(data)
    } catch {
      toast.error('Could not load saved profiles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshProfiles()
  }, [])

  const saveCurrent = async () => {
    if (!profileName.trim()) {
      toast.error('Name the profile before saving')
      return
    }
    setSaving(true)
    const toastId = toast.loading('Saving profile...')
    try {
      await resumeApi.createProfile({
        name: profileName,
        resume_data: resume,
        template_id: templateId,
        color_scheme: colorScheme,
        job_description: jobDescription,
      })
      setProfileName('')
      await refreshProfiles()
      toast.success('Profile saved', { id: toastId })
    } catch {
      toast.error('Could not save profile', { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const loadProfile = async (id: string) => {
    const toastId = toast.loading('Loading profile...')
    try {
      const profile = await resumeApi.getProfile(id)
      loadWorkspace(profile)
      toast.success('Profile loaded into workspace', { id: toastId })
    } catch {
      toast.error('Could not load profile', { id: toastId })
    }
  }

  const deleteProfile = async (id: string) => {
    const toastId = toast.loading('Deleting profile...')
    try {
      await resumeApi.deleteProfile(id)
      setProfiles(current => current.filter(item => item.id !== id))
      toast.success('Profile deleted', { id: toastId })
    } catch {
      toast.error('Could not delete profile', { id: toastId })
    }
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 12 }}>
      <div className="card" style={{ padding: 14 }}>
        <div className="section-title">Save Current Workspace</div>
        <div style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>
          Store snapshots of your resume, template, and target role for quick reuse.
        </div>
        <Input
          label="Profile Name"
          value={profileName}
          onChange={event => setProfileName(event.target.value)}
          placeholder="Growth PM - Q2 Applications"
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn btn-primary btn-sm" disabled={saving} onClick={saveCurrent}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => void refreshProfiles()}>Refresh List</button>
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="section-title">Saved Profiles</div>
        {loading ? (
          <div style={{ fontSize: 12, color: '#71717a' }}>Loading...</div>
        ) : profiles.length === 0 ? (
          <div style={{ fontSize: 12, color: '#71717a' }}>No saved profiles yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {profiles.map(profile => (
              <div
                key={profile.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: 10,
                  borderRadius: 9,
                  border: '1px solid #2a2a3a',
                  background: '#0f0f16',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7' }}>{profile.name}</div>
                  <div style={{ fontSize: 11, color: '#71717a' }}>
                    Updated {new Date(profile.updated_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => void loadProfile(profile.id)}>Load</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => void deleteProfile(profile.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
