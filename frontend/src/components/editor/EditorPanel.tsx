import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useResumeStore } from '../../stores/resumeStore'
import { resumeApi } from '../../lib/api'
import { Input, Textarea, Grid2, Tabs, TagInput, Spinner, Divider } from '../ui'
import { useAuthStore } from '../../stores/authStore'
import './EditorPanel.css'

export function EditorPanel() {
  const [tab, setTab] = useState('basics')
  const { reset, resume, jobDescription, setSummary, updateExperience, updateProject } = useResumeStore()
  const [polishing, setPolishing] = useState(false)

  const handleReset = () => {
    if (window.confirm('Reset the entire resume workspace? This clears all content, the generated preview, and ATS analysis.')) {
      reset()
      setTab('basics')
    }
  }

  const polishAll = async () => {
    const hasContent = Boolean(
      resume.summary.trim() ||
      resume.experiences.some(item => item.bullets.length > 0) ||
      resume.projects.some(item => item.description.trim())
    )
    if (!hasContent) {
      toast.error('Add some resume content first')
      return
    }

    setPolishing(true)
    const tid = toast.loading('Polishing resume content…')

    try {
      if (resume.summary.trim()) {
        const summaryResult = await resumeApi.improve({
          content: resume.summary,
          mode: 'summary',
          job_description: jobDescription,
        })
        setSummary(summaryResult.improved)
      }

      for (const experience of resume.experiences) {
        if (!experience.bullets.length) continue
        const bulletsResult = await resumeApi.improve({
          content: experience.bullets.join('\n'),
          context: `${experience.role} at ${experience.company}`,
          job_description: jobDescription,
          mode: 'bullets',
        })
        updateExperience(experience.id, 'bullets', bulletsResult.improved.split('\n').map(line => line.trim()).filter(Boolean))
      }

      for (const project of resume.projects) {
        if (!project.description.trim()) continue
        const projectResult = await resumeApi.improve({
          content: project.description,
          context: project.name,
          job_description: jobDescription,
          mode: 'general',
        })
        updateProject(project.id, 'description', projectResult.improved)
      }

      toast.success('Resume polished!', { id: tid })
    } catch {
      toast.error('Could not polish — is the backend running?', { id: tid })
    } finally {
      setPolishing(false)
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <div style={{ fontSize: 12, color: '#71717a' }}>Build, refine, and reuse sections without starting over.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={polishAll} disabled={polishing}>
            {polishing ? <Spinner size={12} /> : '✦'} Polish All
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>Reset Resume</button>
        </div>
      </div>
      <Tabs
        tabs={[
          { id: 'basics',     label: 'Basics'     },
          { id: 'experience', label: 'Experience'  },
          { id: 'education',  label: 'Education'   },
          { id: 'skills',     label: 'Skills'      },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'basics'     && <BasicsTab />}
      {tab === 'experience' && <ExperienceTab />}
      {tab === 'education'  && <EducationTab />}
      {tab === 'skills'     && <SkillsTab />}
    </div>
  )
}

// ── Basics ─────────────────────────────────────────────────────────────
function BasicsTab() {
  const { resume, setContact, setSummary, setPhoto, ats, keywordAnalysis, setKeywordAnalysis, templateId, colorScheme } = useResumeStore()
  const { contact, summary } = resume
  const photoRef = useRef<HTMLInputElement>(null)
  const [improving, setImproving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const { jobDescription } = useResumeStore()
  const { isAuthenticated } = useAuthStore()

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const improvedSummary = async () => {
    if (!summary) { toast.error('Write a summary first'); return }
    setImproving(true)
    try {
      const res = await resumeApi.improve({ content: summary, mode: 'summary', job_description: jobDescription })
      setSummary(res.improved)
      toast.success('Summary improved!')
    } catch { toast.error('Could not improve — is the backend running?') }
    finally { setImproving(false) }
  }

  const analyzeKeywords = async () => {
    if (!jobDescription.trim()) {
      toast.error('Add a job description first')
      return
    }

    setAnalyzing(true)
    const tid = toast.loading('Analyzing keywords…')
    try {
      const res = await resumeApi.analyzeKeywords({
        resume_data: resume,
        template_id: templateId,
        color_scheme: colorScheme,
        job_description: jobDescription,
      })
      setKeywordAnalysis(res)
      toast.success('Keywords analyzed', { id: tid })
    } catch {
      toast.error('Could not analyze keywords — is the backend running?', { id: tid })
    } finally {
      setAnalyzing(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !jobDescription.trim()) {
      return
    }

    const handle = window.setTimeout(async () => {
      try {
        const latestResume = useResumeStore.getState().resume
        const res = await resumeApi.analyzeKeywords({
          resume_data: latestResume,
          template_id: templateId,
          color_scheme: colorScheme,
          job_description: jobDescription,
        })
        setKeywordAnalysis(res)
      } catch {
        // Keep existing analysis if transient request fails while typing.
      }
    }, 700)

    return () => window.clearTimeout(handle)
  }, [
    isAuthenticated,
    jobDescription,
    templateId,
    colorScheme,
    resume.summary,
    resume.experiences,
    resume.projects,
    setKeywordAnalysis,
  ])

  return (
    <div className="ep-col-12">
      {/* Photo */}
      <div className="card ep-pad-14">
        <div className="section-title">Profile Photo</div>
        <div className="ep-row-center-14">
          <div
            className="ep-photo-drop"
            onClick={() => photoRef.current?.click()}
          >
            {resume.photo_base64
              ? <img src={resume.photo_base64} alt="Profile preview" className="ep-photo-img" />
              : <span className="ep-photo-plus">+</span>}
          </div>
          <div className="ep-photo-help">
            Optional — used only in photo templates.<br />
            <button className="btn btn-ghost btn-sm ep-mt-6" onClick={() => photoRef.current?.click()}>Upload</button>
            {resume.photo_base64 && <button className="btn btn-ghost btn-sm ep-ml-6" onClick={() => setPhoto(null)}>Remove</button>}
          </div>
          <input ref={photoRef} type="file" accept="image/*" aria-label="Upload profile photo" title="Upload profile photo" className="ep-hidden" onChange={handlePhoto} />
        </div>
      </div>

      {/* Contact */}
      <div className="card ep-pad-14">
        <div className="section-title">Personal Info</div>
        <div className="ep-col-8">
          <Input label="Full Name" value={contact.name} onChange={e => setContact('name', e.target.value)} placeholder="Jane Smith" />
          <Input label="Job Title / Headline" value={contact.title} onChange={e => setContact('title', e.target.value)} placeholder="Senior Software Engineer" />
          <Grid2>
            <Input label="Email" type="email" value={contact.email} onChange={e => setContact('email', e.target.value)} placeholder="jane@email.com" />
            <Input label="Phone" value={contact.phone} onChange={e => setContact('phone', e.target.value)} placeholder="+1 234 567 8900" />
          </Grid2>
          <Grid2>
            <Input label="Location" value={contact.location} onChange={e => setContact('location', e.target.value)} placeholder="San Francisco, CA" />
            <Input label="LinkedIn" value={contact.linkedin} onChange={e => setContact('linkedin', e.target.value)} placeholder="linkedin.com/in/jane" />
          </Grid2>
          <Grid2>
            <Input label="Portfolio / GitHub" value={contact.portfolio} onChange={e => setContact('portfolio', e.target.value)} placeholder="github.com/jane" />
            <Input label="Website" value={contact.website} onChange={e => setContact('website', e.target.value)} placeholder="janesmith.dev" />
          </Grid2>
        </div>
      </div>

      {/* Summary */}
      <div className="card ep-pad-14">
        <div className="section-title">Professional Summary</div>
        <Textarea
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder="Write a compelling 2-3 sentence summary that highlights your key strengths and career goals…"
          className="ep-textarea-90"
        />
        <button
          className="btn btn-ghost btn-sm ep-mt-8"
          onClick={improvedSummary}
          disabled={improving}
        >
          {improving ? <Spinner size={12} /> : '✦'} AI Improve
        </button>
        <button
          className="btn btn-ghost btn-sm ep-mt-8"
          onClick={analyzeKeywords}
          disabled={analyzing}
          style={{ marginLeft: 8 }}
        >
          {analyzing ? <Spinner size={12} /> : '◎'} Analyze Keywords
        </button>
        {ats && (ats.matched_keywords.length > 0 || ats.missing_keywords.length > 0) && (
          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            {ats.matched_keywords.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', marginBottom: 6 }}>Matched keywords</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ats.matched_keywords.map(keyword => (
                    <span key={keyword} style={{ padding: '4px 8px', borderRadius: 9999, fontSize: 11, color: '#4ade80', background: 'rgba(34,197,94,0.1)' }}>{keyword}</span>
                  ))}
                </div>
              </div>
            )}
            {ats.missing_keywords.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#f87171', marginBottom: 6 }}>Missing keywords</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ats.missing_keywords.map(keyword => (
                    <span key={keyword} style={{ padding: '4px 8px', borderRadius: 9999, fontSize: 11, color: '#f87171', background: 'rgba(239,68,68,0.1)' }}>{keyword}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {keywordAnalysis && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 10, border: '1px solid #2a2a3a', background: '#111118', display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#e4e4e7' }}>Keyword Lens</div>
                <div style={{ fontSize: 11, color: '#71717a' }}>Inline NLP matching for the active job target.</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6c63ff' }}>{keywordAnalysis.score}%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', marginBottom: 6 }}>Highlighted summary</div>
              <div
                style={{ fontSize: 12, lineHeight: 1.7, color: '#d4d4d8', padding: '10px 12px', borderRadius: 8, background: '#0a0a0f', border: '1px solid #2a2a3a' }}
                dangerouslySetInnerHTML={{ __html: highlightKeywords(summary || 'No summary yet', keywordAnalysis.highlight_terms) }}
              />
            </div>
            {resume.experiences[0]?.bullets[0] && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', marginBottom: 6 }}>Highlighted bullets</div>
                <div
                  style={{ fontSize: 12, lineHeight: 1.7, color: '#d4d4d8', padding: '10px 12px', borderRadius: 8, background: '#0a0a0f', border: '1px solid #2a2a3a' }}
                  dangerouslySetInnerHTML={{ __html: highlightKeywords(resume.experiences[0].bullets.join(' • '), keywordAnalysis.highlight_terms) }}
                />
              </div>
            )}
            {keywordAnalysis.suggested_focus.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#fbbf24', marginBottom: 6 }}>Suggested focus</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {keywordAnalysis.suggested_focus.map(keyword => (
                    <span key={keyword} style={{ padding: '4px 8px', borderRadius: 9999, fontSize: 11, color: '#fbbf24', background: 'rgba(245,158,11,0.1)' }}>{keyword}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightKeywords(text: string, keywords: string[]): string {
  if (!text) return ''
  const unique = [...new Set(keywords.map(keyword => keyword.trim()).filter(Boolean))].sort((a, b) => b.length - a.length)
  let output = escapeHtml(text)

  for (const keyword of unique) {
    const pattern = new RegExp(`(${escapeRegExp(keyword)})`, 'gi')
    output = output.replace(pattern, '<mark style="background: rgba(108, 99, 255, 0.2); color: #f4f4f8; padding: 0 2px; border-radius: 4px;">$1</mark>')
  }

  return output
}

// ── Experience ─────────────────────────────────────────────────────────
function ExperienceTab() {
  const { resume, addExperience, updateExperience, removeExperience, duplicateExperience } = useResumeStore()
  const { jobDescription } = useResumeStore()
  const [improving, setImproving] = useState<string | null>(null)

  const improveBullets = async (id: string, bullets: string[], role: string) => {
    if (!bullets.length) { toast.error('Add some bullets first'); return }
    setImproving(id)
    try {
      const res = await resumeApi.improve({
        content: bullets.join('\n'),
        context: role,
        job_description: jobDescription,
        mode: 'bullets',
      })
      updateExperience(id, 'bullets', res.improved.split('\n').filter(Boolean))
      toast.success('Bullets improved!')
    } catch { toast.error('Could not improve — is the backend running?') }
    finally { setImproving(null) }
  }

  return (
    <div>
      {resume.experiences.map((exp, idx) => (
        <div key={exp.id} className="card ep-item-card">
          <div className="ep-item-header">
            <span className="ep-item-label">Experience {idx + 1}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => duplicateExperience(exp.id)} title="Duplicate experience">⧉</button>
              <button className="btn btn-ghost btn-icon btn-sm ep-danger" onClick={() => removeExperience(exp.id)}>✕</button>
            </div>
          </div>
          <div className="ep-col-8">
            <Grid2>
              <Input label="Company" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} placeholder="Company Name" />
              <Input label="Role / Title" value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} placeholder="Software Engineer" />
            </Grid2>
            <Grid2>
              <Input label="Start Date" value={exp.start} onChange={e => updateExperience(exp.id, 'start', e.target.value)} placeholder="Jan 2022" />
              <Input label="End Date" value={exp.end} onChange={e => updateExperience(exp.id, 'end', e.target.value)} placeholder="Present" />
            </Grid2>
            <div>
              <label className="label">Achievements / Bullets (one per line)</label>
              <textarea
                className="input ep-textarea-90"
                placeholder="Led migration to microservices, reducing latency by 40%&#10;Mentored 3 junior engineers to senior level&#10;Built CI/CD pipeline serving 500k daily users"
                value={exp.bullets.join('\n')}
                onChange={e => updateExperience(exp.id, 'bullets', e.target.value.split('\n'))}
              />
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => improveBullets(exp.id, exp.bullets, exp.role)}
              disabled={improving === exp.id}
            >
              {improving === exp.id ? <Spinner size={12} /> : '✦'} AI Improve Bullets
            </button>
          </div>
        </div>
      ))}
      <button className="add-row" onClick={addExperience}>+ Add Experience</button>
    </div>
  )
}

// ── Education ──────────────────────────────────────────────────────────
function EducationTab() {
  const { resume, addEducation, updateEducation, removeEducation, duplicateEducation, addCertification, updateCertification, removeCertification, duplicateCertification } = useResumeStore()

  return (
    <div>
      {resume.educations.map((edu, idx) => (
        <div key={edu.id} className="card ep-item-card">
          <div className="ep-item-header">
            <span className="ep-item-label">Education {idx + 1}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => duplicateEducation(edu.id)} title="Duplicate education">⧉</button>
              <button className="btn btn-ghost btn-icon btn-sm ep-danger" onClick={() => removeEducation(edu.id)}>✕</button>
            </div>
          </div>
          <div className="ep-col-8">
            <Input label="School / University" value={edu.school} onChange={e => updateEducation(edu.id, 'school', e.target.value)} placeholder="MIT" />
            <Grid2>
              <Input label="Degree" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} placeholder="Bachelor's" />
              <Input label="Field of Study" value={edu.field} onChange={e => updateEducation(edu.id, 'field', e.target.value)} placeholder="Computer Science" />
            </Grid2>
            <Grid2>
              <Input label="Graduation Year" value={edu.year} onChange={e => updateEducation(edu.id, 'year', e.target.value)} placeholder="2020" />
              <Input label="GPA (optional)" value={edu.gpa} onChange={e => updateEducation(edu.id, 'gpa', e.target.value)} placeholder="3.8/4.0" />
            </Grid2>
          </div>
        </div>
      ))}
      <button className="add-row" onClick={addEducation}>+ Add Education</button>

      <Divider />
      <div className="section-title ep-mt-4">Certifications</div>
      {resume.certifications.map((cert, idx) => (
        <div key={cert.id} className="card ep-item-card">
          <div className="ep-item-header">
            <span className="ep-item-label">Cert {idx + 1}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => duplicateCertification(cert.id)} title="Duplicate certification">⧉</button>
              <button className="btn btn-ghost btn-icon btn-sm ep-danger" onClick={() => removeCertification(cert.id)}>✕</button>
            </div>
          </div>
          <div className="ep-col-8">
            <Input label="Certification Name" value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)} placeholder="AWS Solutions Architect" />
            <Grid2>
              <Input label="Issuer" value={cert.issuer} onChange={e => updateCertification(cert.id, 'issuer', e.target.value)} placeholder="Amazon" />
              <Input label="Year" value={cert.year} onChange={e => updateCertification(cert.id, 'year', e.target.value)} placeholder="2023" />
            </Grid2>
          </div>
        </div>
      ))}
      <button className="add-row" onClick={addCertification}>+ Add Certification</button>
    </div>
  )
}

// ── Skills ─────────────────────────────────────────────────────────────
function SkillsTab() {
  const { resume, addSkill, removeSkill, addLanguage, updateLanguage, removeLanguage, duplicateLanguage, addProject, updateProject, removeProject, duplicateProject } = useResumeStore()

  return (
    <div className="ep-col-14">
      <div className="card ep-pad-14">
        <div className="section-title">⚡ Technical Skills</div>
        <TagInput tags={resume.skills.technical} onAdd={s => addSkill('technical', s)} onRemove={s => removeSkill('technical', s)} placeholder="Type skill + Enter" />
      </div>

      <div className="card ep-pad-14">
        <div className="section-title">🤝 Soft Skills</div>
        <TagInput tags={resume.skills.soft} onAdd={s => addSkill('soft', s)} onRemove={s => removeSkill('soft', s)} placeholder="Type skill + Enter" />
      </div>

      <div className="card ep-pad-14">
        <div className="section-title">🌍 Languages</div>
        {resume.languages.map((lang, idx) => (
          <div key={lang.id} className="ep-lang-row">
            <Input label={idx === 0 ? 'Language' : undefined} value={lang.language} onChange={e => updateLanguage(lang.id, 'language', e.target.value)} placeholder="English" />
            <Input label={idx === 0 ? 'Level' : undefined} value={lang.level} onChange={e => updateLanguage(lang.id, 'level', e.target.value)} placeholder="Native" />
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => duplicateLanguage(lang.id)} title="Duplicate language">⧉</button>
              <button className="btn btn-ghost btn-icon btn-sm ep-danger ep-lang-remove" onClick={() => removeLanguage(lang.id)}>✕</button>
            </div>
          </div>
        ))}
        <button className="add-row" onClick={addLanguage}>+ Add Language</button>
      </div>

      <div className="card ep-pad-14">
        <div className="section-title">🚀 Projects</div>
        {resume.projects.map((proj, idx) => (
          <div key={proj.id} className="ep-project-wrap">
            <div className="ep-project-header">
              <span className="ep-project-label">Project {idx + 1}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => duplicateProject(proj.id)} title="Duplicate project">⧉</button>
                <button className="btn btn-ghost btn-icon btn-sm ep-danger" onClick={() => removeProject(proj.id)}>✕</button>
              </div>
            </div>
            <div className="ep-col-6">
              <Input label="Project Name" value={proj.name} onChange={e => updateProject(proj.id, 'name', e.target.value)} placeholder="My Awesome Project" />
              <Textarea label="Description" value={proj.description} onChange={e => updateProject(proj.id, 'description', e.target.value)} placeholder="Brief description of what you built and its impact…" className="ep-textarea-56" />
              <Grid2>
                <Input label="Technologies" value={proj.technologies} onChange={e => updateProject(proj.id, 'technologies', e.target.value)} placeholder="React, Node.js, AWS" />
                <Input label="URL (optional)" value={proj.url} onChange={e => updateProject(proj.id, 'url', e.target.value)} placeholder="github.com/…" />
              </Grid2>
            </div>
            {idx < resume.projects.length - 1 && <Divider />}
          </div>
        ))}
        <button className="add-row" onClick={addProject}>+ Add Project</button>
      </div>
    </div>
  )
}
