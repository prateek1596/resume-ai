import { useState } from 'react'
import { useResumeStore } from '../../stores/resumeStore'
import { Spinner } from '../ui'

interface ResumePreviewProps {
  onGenerate?: () => void
}

export function ResumePreview({ onGenerate }: ResumePreviewProps) {
  const { generatedHtml, isGenerating } = useResumeStore()
  const [scale, setScale] = useState(0.78)

  // When scaled down the div physically shrinks, so we pull up the whitespace below
  const scaledHeight = 1123 * scale
  const marginBottom = scaledHeight - 1123

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Zoom toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: '#1a1a24', border: '1px solid #2a2a3a',
          borderRadius: 8, padding: '3px 6px',
        }}>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => setScale(s => Math.max(0.3, +(s - 0.1).toFixed(1)))}
            title="Zoom out"
          >−</button>
          <span style={{ fontSize: 12, color: '#71717a', minWidth: 38, textAlign: 'center', userSelect: 'none' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => setScale(s => Math.min(1.4, +(s + 0.1).toFixed(1)))}
            title="Zoom in"
          >+</button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setScale(0.78)}>
          Reset
        </button>
        {generatedHtml && (
          <span style={{ fontSize: 11, color: '#3a3a50', marginLeft: 4 }}>
            794 × 1123 px · A4
          </span>
        )}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        {isGenerating ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 14, color: '#52525b',
            minHeight: 400, width: '100%',
          }}>
            <Spinner size={36} />
            <span style={{ fontSize: 14, color: '#71717a' }}>Building your resume…</span>
            <span style={{ fontSize: 12 }}>This takes about 10-15 seconds</span>
          </div>
        ) : generatedHtml ? (
          <div style={{ transformOrigin: 'top center', transform: `scale(${scale})`, marginBottom }}>
            <div
              className="resume-shadow"
              style={{ width: 794, minHeight: 1123, background: '#fff', borderRadius: 2, overflow: 'hidden' }}
              dangerouslySetInnerHTML={{ __html: generatedHtml }}
            />
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 12,
            minHeight: 500, width: '100%',
          }}>
            <div style={{ fontSize: 56, filter: 'grayscale(1)', opacity: 0.3 }}>📄</div>
            <div style={{ fontSize: 16, color: '#52525b', fontWeight: 500 }}>
              Your resume preview will appear here
            </div>
            <div style={{ fontSize: 13, color: '#3a3a50' }}>
              Fill in your details then click Generate
            </div>
            {onGenerate && (
              <button
                className="btn btn-primary"
                style={{ marginTop: 8 }}
                onClick={onGenerate}
              >
                ✦ Generate Resume
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
