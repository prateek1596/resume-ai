import { TEMPLATES, COLOR_SCHEMES } from '../../types/resume'
import { useResumeStore } from '../../stores/resumeStore'
import { useMemo, useState } from 'react'

const TEMPLATE_THUMBS: Record<string, string> = {
  executive: `<svg viewBox="0 0 140 120" fill="none"><rect width="140" height="120" fill="#f8f8fc"/><rect x="0" y="0" width="140" height="32" fill="VAR_C"/><circle cx="20" cy="16" r="11" fill="rgba(255,255,255,0.25)"/><rect x="36" y="8" width="65" height="5" fill="rgba(255,255,255,0.85)" rx="1"/><rect x="36" y="16" width="45" height="3" fill="rgba(255,255,255,0.5)" rx="1"/><rect x="8" y="40" width="50" height="2.5" fill="VAR_C" opacity=".7" rx="1"/><rect x="8" y="47" width="124" height="2" fill="#e5e5e5" rx="1"/><rect x="8" y="52" width="100" height="2" fill="#e5e5e5" rx="1"/><rect x="8" y="62" width="50" height="2.5" fill="VAR_C" opacity=".7" rx="1"/><rect x="8" y="69" width="124" height="2" fill="#e5e5e5" rx="1"/><rect x="8" y="74" width="110" height="2" fill="#e5e5e5" rx="1"/><rect x="8" y="79" width="85" height="2" fill="#e5e5e5" rx="1"/></svg>`,
  minimal: `<svg viewBox="0 0 140 120" fill="none"><rect width="140" height="120" fill="#fafafa"/><rect x="10" y="10" width="3" height="100" fill="VAR_C" rx="1.5"/><rect x="20" y="12" width="80" height="6" fill="#111" rx="1"/><rect x="20" y="22" width="55" height="3" fill="#888" rx="1"/><rect x="20" y="34" width="42" height="2.5" fill="#ccc" rx="1"/><rect x="20" y="40" width="110" height="2" fill="#e5e5e5" rx="1"/><rect x="20" y="45" width="95" height="2" fill="#e5e5e5" rx="1"/><rect x="20" y="55" width="42" height="2.5" fill="#ccc" rx="1"/><rect x="20" y="61" width="110" height="2" fill="#e5e5e5" rx="1"/><rect x="20" y="66" width="80" height="2" fill="#e5e5e5" rx="1"/><rect x="20" y="76" width="42" height="2.5" fill="#ccc" rx="1"/><rect x="20" y="82" width="110" height="2" fill="#e5e5e5" rx="1"/><rect x="20" y="87" width="60" height="2" fill="#e5e5e5" rx="1"/></svg>`,
  split: `<svg viewBox="0 0 140 120" fill="none"><rect width="140" height="120" fill="white"/><rect x="0" y="0" width="44" height="120" fill="VAR_C"/><circle cx="22" cy="20" r="13" fill="rgba(255,255,255,0.2)"/><rect x="6" y="38" width="32" height="2" fill="rgba(255,255,255,0.6)" rx="1"/><rect x="6" y="43" width="25" height="2" fill="rgba(255,255,255,0.35)" rx="1"/><rect x="6" y="52" width="32" height="2" fill="rgba(255,255,255,0.5)" rx="1"/><rect x="6" y="57" width="20" height="2" fill="rgba(255,255,255,0.35)" rx="1"/><rect x="6" y="62" width="28" height="2" fill="rgba(255,255,255,0.35)" rx="1"/><rect x="54" y="10" width="78" height="6" fill="#222" rx="1"/><rect x="54" y="20" width="55" height="3" fill="#888" rx="1"/><rect x="54" y="32" width="36" height="2.5" fill="VAR_C" rx="1"/><rect x="54" y="38" width="78" height="2" fill="#e5e5e5" rx="1"/><rect x="54" y="43" width="60" height="2" fill="#e5e5e5" rx="1"/><rect x="54" y="53" width="36" height="2.5" fill="VAR_C" rx="1"/><rect x="54" y="59" width="78" height="2" fill="#e5e5e5" rx="1"/><rect x="54" y="64" width="48" height="2" fill="#e5e5e5" rx="1"/></svg>`,
  classic: `<svg viewBox="0 0 140 120" fill="none"><rect width="140" height="120" fill="#fff"/><rect x="8" y="8" width="124" height="1" fill="VAR_C"/><rect x="8" y="115" width="124" height="1" fill="VAR_C"/><rect x="8" y="12" width="85" height="7" fill="#111" rx="1"/><rect x="8" y="22" width="55" height="3" fill="#777" rx="1"/><rect x="8" y="32" width="124" height="1" fill="#ddd"/><rect x="8" y="38" width="50" height="2.5" fill="#222" rx="1"/><rect x="8" y="44" width="124" height="2" fill="#eee" rx="1"/><rect x="8" y="49" width="105" height="2" fill="#eee" rx="1"/><rect x="8" y="59" width="50" height="2.5" fill="#222" rx="1"/><rect x="8" y="65" width="124" height="2" fill="#eee" rx="1"/><rect x="8" y="70" width="80" height="2" fill="#eee" rx="1"/><rect x="8" y="80" width="50" height="2.5" fill="#222" rx="1"/><rect x="8" y="86" width="124" height="2" fill="#eee" rx="1"/></svg>`,
  creative: `<svg viewBox="0 0 140 120" fill="none"><rect width="140" height="120" fill="white"/><rect x="0" y="0" width="40" height="120" fill="#f0f0f8"/><circle cx="20" cy="20" r="13" fill="VAR_C" opacity=".5"/><circle cx="20" cy="20" r="9" fill="VAR_C"/><rect x="4" y="40" width="32" height="2" fill="#ccc" rx="1"/><rect x="4" y="46" width="26" height="2" fill="#ddd" rx="1"/><rect x="4" y="56" width="32" height="2" fill="#ccc" rx="1"/><rect x="4" y="62" width="20" height="2" fill="#ddd" rx="1"/><rect x="50" y="10" width="82" height="6" fill="#111" rx="1"/><rect x="50" y="20" width="60" height="3" fill="#888" rx="1"/><rect x="50" y="32" width="38" height="2.5" fill="VAR_C" rx="1"/><rect x="50" y="38" width="82" height="2" fill="#e5e5e5" rx="1"/><rect x="50" y="43" width="68" height="2" fill="#e5e5e5" rx="1"/><rect x="50" y="53" width="38" height="2.5" fill="VAR_C" rx="1"/><rect x="50" y="59" width="82" height="2" fill="#e5e5e5" rx="1"/></svg>`,
  tech: `<svg viewBox="0 0 140 120" fill="none"><rect width="140" height="120" fill="#0d1117"/><rect x="0" y="0" width="140" height="28" fill="VAR_C" opacity=".9"/><rect x="8" y="8" width="55" height="5" fill="white" opacity=".9" rx="1"/><rect x="8" y="17" width="35" height="3" fill="white" opacity=".5" rx="1"/><rect x="100" y="6" width="32" height="14" fill="rgba(255,255,255,0.1)" rx="2"/><rect x="8" y="36" width="44" height="2.5" fill="VAR_C" opacity=".8" rx="1"/><rect x="8" y="43" width="124" height="2" fill="#21262d" rx="1"/><rect x="8" y="48" width="100" height="2" fill="#21262d" rx="1"/><rect x="8" y="58" width="44" height="2.5" fill="VAR_C" opacity=".8" rx="1"/><rect x="8" y="65" width="124" height="2" fill="#21262d" rx="1"/><rect x="8" y="70" width="80" height="2" fill="#21262d" rx="1"/><rect x="8" y="80" width="124" height="2" fill="#21262d" rx="1"/></svg>`,
  elegant: `<svg viewBox="0 0 140 120" fill="none"><rect width="140" height="120" fill="#fffdf8"/><rect x="45" y="6" width="50" height="4" fill="VAR_C" opacity=".6" rx="1"/><circle cx="70" cy="24" r="13" fill="rgba(0,0,0,0.06)"/><circle cx="70" cy="24" r="9" fill="VAR_C" opacity=".35"/><rect x="28" y="42" width="84" height="5" fill="#111" rx="1"/><rect x="38" y="51" width="64" height="3" fill="#999" rx="1"/><rect x="10" y="60" width="120" height="1" fill="VAR_C" opacity=".4"/><rect x="10" y="66" width="50" height="2.5" fill="#333" rx="1"/><rect x="10" y="72" width="120" height="2" fill="#e5e5e5" rx="1"/><rect x="10" y="77" width="100" height="2" fill="#e5e5e5" rx="1"/><rect x="10" y="87" width="50" height="2.5" fill="#333" rx="1"/><rect x="10" y="93" width="120" height="2" fill="#e5e5e5" rx="1"/></svg>`,
  sharp: `<svg viewBox="0 0 140 120" fill="none"><rect width="140" height="120" fill="white"/><polygon points="0,0 140,0 140,28 0,38" fill="VAR_C"/><rect x="8" y="7" width="80" height="6" fill="white" opacity=".9" rx="1"/><rect x="8" y="17" width="55" height="3" fill="white" opacity=".55" rx="1"/><rect x="8" y="44" width="44" height="3" fill="VAR_C" rx="1"/><rect x="8" y="51" width="124" height="2" fill="#eee" rx="1"/><rect x="8" y="56" width="105" height="2" fill="#eee" rx="1"/><rect x="8" y="66" width="44" height="3" fill="VAR_C" rx="1"/><rect x="8" y="73" width="124" height="2" fill="#eee" rx="1"/><rect x="8" y="78" width="80" height="2" fill="#eee" rx="1"/></svg>`,
  timeline: `<svg viewBox="0 0 140 120" fill="none"><rect width="140" height="120" fill="white"/><rect x="0" y="0" width="140" height="30" fill="VAR_C"/><circle cx="22" cy="15" r="11" fill="rgba(255,255,255,0.2)"/><rect x="38" y="7" width="75" height="5" fill="white" opacity=".9" rx="1"/><rect x="38" y="16" width="50" height="3" fill="rgba(255,255,255,0.55)" rx="1"/><rect x="22" y="36" width="1.5" height="76" fill="#e5e5e5" rx="1"/><circle cx="22" cy="46" r="4" fill="VAR_C"/><rect x="32" y="43" width="98" height="3" fill="#333" rx="1"/><rect x="32" y="49" width="75" height="2" fill="#e5e5e5" rx="1"/><circle cx="22" cy="65" r="4" fill="VAR_C" opacity=".6"/><rect x="32" y="62" width="98" height="3" fill="#333" rx="1"/><rect x="32" y="68" width="55" height="2" fill="#e5e5e5" rx="1"/><circle cx="22" cy="82" r="4" fill="VAR_C" opacity=".35"/><rect x="32" y="79" width="98" height="3" fill="#333" rx="1"/><rect x="32" y="85" width="70" height="2" fill="#e5e5e5" rx="1"/></svg>`,
  ats_pure: `<svg viewBox="0 0 140 120" fill="none"><rect width="140" height="120" fill="white"/><rect x="8" y="8" width="90" height="7" fill="#111" rx="1"/><rect x="8" y="18" width="60" height="3" fill="#555" rx="1"/><rect x="8" y="28" width="124" height="1.5" fill="#000"/><rect x="8" y="34" width="42" height="3" fill="#000" rx="1"/><rect x="8" y="41" width="124" height="2" fill="#eee" rx="1"/><rect x="8" y="46" width="110" height="2" fill="#eee" rx="1"/><rect x="8" y="51" width="98" height="2" fill="#eee" rx="1"/><rect x="8" y="60" width="42" height="3" fill="#000" rx="1"/><rect x="8" y="67" width="124" height="2" fill="#eee" rx="1"/><rect x="8" y="72" width="85" height="2" fill="#eee" rx="1"/><rect x="8" y="82" width="42" height="3" fill="#000" rx="1"/><rect x="8" y="89" width="124" height="2" fill="#eee" rx="1"/></svg>`,
  bento: `<svg viewBox="0 0 140 120" fill="none"><rect width="140" height="120" fill="#f7f7fb"/><rect x="8" y="8" width="56" height="42" rx="8" fill="VAR_C"/><rect x="68" y="8" width="64" height="18" rx="8" fill="#ffffff" stroke="#e5e7eb"/><rect x="68" y="30" width="64" height="20" rx="8" fill="#ffffff" stroke="#e5e7eb"/><rect x="8" y="54" width="34" height="14" rx="7" fill="#ffffff" stroke="#e5e7eb"/><rect x="46" y="54" width="34" height="14" rx="7" fill="#ffffff" stroke="#e5e7eb"/><rect x="84" y="54" width="48" height="14" rx="7" fill="#ffffff" stroke="#e5e7eb"/><rect x="8" y="74" width="124" height="34" rx="10" fill="#ffffff" stroke="#e5e7eb"/></svg>`,
  monograph: `<svg viewBox="0 0 140 120" fill="none"><rect width="140" height="120" fill="#fcfbf7"/><rect x="18" y="10" width="104" height="3" fill="VAR_C" opacity=".65" rx="1"/><rect x="33" y="20" width="74" height="7" fill="#111" rx="1"/><rect x="49" y="30" width="42" height="3" fill="#666" rx="1"/><rect x="18" y="40" width="104" height="1" fill="#d6d3d1"/><rect x="18" y="47" width="48" height="3" fill="#111" rx="1"/><rect x="18" y="54" width="104" height="2" fill="#e7e5e4" rx="1"/><rect x="18" y="60" width="88" height="2" fill="#e7e5e4" rx="1"/><rect x="18" y="70" width="48" height="3" fill="#111" rx="1"/><rect x="18" y="77" width="104" height="2" fill="#e7e5e4" rx="1"/><rect x="18" y="83" width="76" height="2" fill="#e7e5e4" rx="1"/><rect x="18" y="93" width="48" height="3" fill="#111" rx="1"/><rect x="18" y="100" width="104" height="2" fill="#e7e5e4" rx="1"/></svg>`,
  duo: `<svg viewBox="0 0 140 120" fill="none"><rect width="140" height="120" fill="#ffffff"/><rect x="0" y="0" width="34" height="120" fill="VAR_C"/><circle cx="17" cy="18" r="10" fill="rgba(255,255,255,.24)"/><rect x="43" y="10" width="80" height="6" rx="2" fill="#111"/><rect x="43" y="20" width="52" height="3" rx="1.5" fill="#777"/><rect x="43" y="34" width="26" height="3" rx="1.5" fill="VAR_C"/><rect x="43" y="42" width="80" height="2" rx="1" fill="#e5e7eb"/><rect x="43" y="48" width="66" height="2" rx="1" fill="#e5e7eb"/><rect x="43" y="58" width="26" height="3" rx="1.5" fill="VAR_C"/><rect x="43" y="66" width="80" height="2" rx="1" fill="#e5e7eb"/><rect x="43" y="72" width="58" height="2" rx="1" fill="#e5e7eb"/><rect x="43" y="82" width="26" height="3" rx="1.5" fill="VAR_C"/><rect x="43" y="90" width="80" height="2" rx="1" fill="#e5e7eb"/></svg>`,
}

export function TemplatesPanel() {
  const { templateId, colorScheme, setTemplate, setColorScheme } = useResumeStore()
  const [category, setCategory] = useState<'all' | 'modern' | 'classic' | 'creative' | 'minimal' | 'ats'>('all')

  const accentColors: Record<string, string> = {
    classic: '#6c63ff', navy: '#3b82f6', emerald: '#10b981',
    crimson: '#dc2626', slate: '#475569', gold: '#b45309',
  }
  const currentColor = accentColors[colorScheme] ?? '#6c63ff'
  const categories = ['all', 'modern', 'classic', 'creative', 'minimal', 'ats'] as const

  const thumb = (id: string) => {
    const raw = TEMPLATE_THUMBS[id] ?? TEMPLATE_THUMBS.executive
    return raw.replaceAll('VAR_C', currentColor)
  }

  const visibleTemplates = useMemo(
    () => (category === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === category)),
    [category]
  )

  return (
    <div className="fade-in">
      {/* Color scheme */}
      <div style={{ marginBottom: 16 }}>
        <div className="section-title">Color Scheme</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLOR_SCHEMES.map(cs => (
            <button
              key={cs.id}
              title={cs.label}
              onClick={() => setColorScheme(cs.id)}
              style={{
                width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                background: cs.swatch, border: colorScheme === cs.id ? '3px solid white' : '3px solid transparent',
                outline: colorScheme === cs.id ? `2px solid ${cs.swatch}` : 'none',
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="section-title">Template</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {categories.map(option => (
          <button
            key={option}
            className="btn btn-ghost btn-sm"
            onClick={() => setCategory(option)}
            style={{
              padding: '5px 10px',
              borderColor: category === option ? currentColor : '#2a2a3a',
              color: category === option ? '#fff' : '#a1a1aa',
              background: category === option ? `${currentColor}22` : 'transparent',
            }}
          >
            {option === 'all' ? 'All' : option}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {visibleTemplates.map(t => (
          <div
            key={t.id}
            onClick={() => setTemplate(t.id)}
            style={{
              border: `2px solid ${templateId === t.id ? currentColor : '#2a2a3a'}`,
              borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: '#1a1a24',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxShadow: templateId === t.id ? `0 0 0 3px ${currentColor}30` : 'none',
            }}
          >
            {/* Thumbnail */}
            <div
              style={{ height: 110, overflow: 'hidden', background: '#f5f5f5' }}
              dangerouslySetInnerHTML={{ __html: thumb(t.id) }}
            />
            <div style={{ padding: '8px 10px', borderTop: '1px solid #2a2a3a' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7', marginBottom: 2 }}>{t.name}</div>
              <div style={{ fontSize: 10, color: '#71717a', display: 'flex', alignItems: 'center', gap: 4 }}>
                {t.hasPhoto && <span style={{ background: 'rgba(78,205,196,0.15)', color: '#4ecdc4', padding: '1px 5px', borderRadius: 9999, fontSize: 9 }}>📸</span>}
                {t.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
