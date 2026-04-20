import { useState } from 'react'
import { useResumeStore } from './stores/resumeStore'
import { useGenerate } from './hooks/useGenerate'
import { UploadPanel } from './components/editor/UploadPanel'
import { EditorPanel } from './components/editor/EditorPanel'
import { TemplatesPanel } from './components/templates/TemplatesPanel'
import { ATSPanel } from './components/resume/ATSPanel'
import { ResumePreview } from './components/resume/ResumePreview'
import { Badge } from './components/ui'
import { AuthPanel } from './components/auth/AuthPanel'
import { useAuthStore } from './stores/authStore'

type Section = 'upload' | 'edit' | 'templates' | 'ats'

const SECTION_LABELS: Record<Section, string> = {
  upload: 'Import Profile',
  edit: 'Edit Content',
  templates: 'Templates',
  ats: 'ATS Analysis',
}

const NAV: { id: Section; icon: string; label: string }[] = [
  { id: 'upload',    icon: '⬆', label: 'Import Profile' },
  { id: 'edit',      icon: '✎', label: 'Edit Content'   },
  { id: 'templates', icon: '◫', label: 'Templates'      },
  { id: 'ats',       icon: '◎', label: 'ATS Score'      },
]

function atsVariant(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 80) return 'green'
  if (score >= 60) return 'yellow'
  return 'red'
}

export default function App() {
  const [section, setSection] = useState<Section>('upload')
  const { resume, ats, loadDemoResume } = useResumeStore()
  const { generate, downloadPDF, downloadDocx, isGenerating } = useGenerate()
  const { isAuthenticated } = useAuthStore()

  const handleGenerate = async () => {
    const ok = await generate()
    if (ok) setSection('ats')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0a0a0f' }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside style={{
        width: 224, minWidth: 224,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #2a2a3a' }}>
          <div style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: 22, lineHeight: 1 }}>
            Resume<span style={{ color: '#6c63ff' }}>AI</span>
          </div>
          <div style={{ fontSize: 11, color: '#52525b', marginTop: 4, letterSpacing: '0.04em' }}>
            ATS-Optimized Builder
          </div>
        </div>

        <AuthPanel />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: '#3a3a50',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '6px 16px 6px',
          }}>
            Workspace
          </div>
          {NAV.map(item => (
            <button
              key={item.id}
              className={`nav-item${section === item.id ? ' active' : ''}`}
              onClick={() => setSection(item.id)}
            >
              <span style={{ fontSize: 14, opacity: 0.65, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
              {item.id === 'ats' && ats && (
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                  color: ats.score >= 80 ? '#4ade80' : ats.score >= 60 ? '#fbbf24' : '#f87171',
                }}>
                  {ats.score}%
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div style={{ padding: '10px 12px 14px', borderTop: '1px solid #2a2a3a', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleGenerate}
            disabled={isGenerating || !isAuthenticated}
          >
            {isGenerating ? (
              <><span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span> Generating…</>
            ) : !isAuthenticated ? 'Sign in to Generate' : '✦ Generate Resume'}
          </button>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={downloadPDF}
            disabled={!useResumeStore.getState().generatedHtml || !isAuthenticated}
          >
            ↓ Download PDF
          </button>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => {
              loadDemoResume()
              setSection('edit')
            }}
          >
            ✦ Load Demo Resume
          </button>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={downloadDocx}
            disabled={!isAuthenticated}
          >
            ⬇ DOCX
          </button>
        </div>
      </aside>

      {/* ── Editor panel ────────────────────────────────────────── */}
      <div style={{
        width: 356, minWidth: 356,
        background: '#111118', borderRight: '1px solid #2a2a3a',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Panel header */}
        <div style={{
          padding: '13px 16px', borderBottom: '1px solid #2a2a3a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>
            {SECTION_LABELS[section]}
          </span>
          {ats && <Badge variant={atsVariant(ats.score)}>ATS {ats.score}%</Badge>}
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {section === 'upload'    && <UploadPanel    onImported={() => setSection('edit')} />}
          {section === 'edit'      && <EditorPanel />}
          {section === 'templates' && <TemplatesPanel />}
          {section === 'ats'       && <ATSPanel />}
        </div>
      </div>

      {/* ── Preview pane ────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        background: '#0a0a0f',
      }}>
        {/* Preview topbar */}
        <div style={{
          padding: '11px 20px', borderBottom: '1px solid #2a2a3a',
          background: '#111118',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, color: '#52525b', flex: 1 }}>
            {resume.contact.name
              ? `${resume.contact.name} · ${useResumeStore.getState().templateId}`
              : 'Preview'}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleGenerate} disabled={isGenerating}>
            ↻ Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={downloadPDF}>
            ↓ PDF
          </button>
        </div>

        {/* Resume preview */}
        <div style={{ flex: 1, overflow: 'auto', padding: '28px 36px' }}>
          <ResumePreview onGenerate={handleGenerate} />
        </div>
      </div>
    </div>
  )
}
