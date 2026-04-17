import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

// ── Input ──────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, className = '', ...props }, ref) => (
  <div>
    {label && <label className="label">{label}</label>}
    <input ref={ref} className={`input ${className}`} {...props} />
  </div>
))
Input.displayName = 'Input'

// ── Textarea ───────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, className = '', ...props }, ref) => (
  <div>
    {label && <label className="label">{label}</label>}
    <textarea ref={ref} className={`input ui-textarea ${className}`} {...props} />
  </div>
))
Textarea.displayName = 'Textarea'

// ── Grid 2-col ─────────────────────────────────────────────────────────
export function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="ui-grid2">{children}</div>
}

// ── SectionTitle ───────────────────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="section-title">{children}</div>
}

// ── Divider ────────────────────────────────────────────────────────────
export function Divider() {
  return <div className="ui-divider" />
}

// ── Spinner ────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="spinner"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

// ── Tabs ───────────────────────────────────────────────────────────────
interface Tab { id: string; label: string }
interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}
export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="ui-tabs-wrap">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab${active === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── TagInput ───────────────────────────────────────────────────────────
interface TagInputProps {
  tags: string[]
  onAdd: (s: string) => void
  onRemove: (s: string) => void
  placeholder?: string
}
export function TagInput({ tags, onAdd, onRemove, placeholder = 'Type + Enter' }: TagInputProps) {
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const val = e.currentTarget.value.replace(',', '').trim()
    if ((e.key === 'Enter' || e.key === ',') && val) {
      e.preventDefault()
      onAdd(val)
      e.currentTarget.value = ''
    } else if (e.key === 'Backspace' && !e.currentTarget.value && tags.length) {
      onRemove(tags[tags.length - 1])
    }
  }
  return (
    <div
      className="ui-tag-input"
      onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}
    >
      {tags.map(t => (
        <span key={t} className="tag">
          {t}
          <span className="tag-remove" onClick={() => onRemove(t)}>✕</span>
        </span>
      ))}
      <input
        className="ui-tag-input-field"
        placeholder={placeholder}
        onKeyDown={handleKey}
      />
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────
type BadgeVariant = 'purple' | 'teal' | 'green' | 'red' | 'yellow'
export function Badge({ children, variant = 'purple' }: { children: React.ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={`ui-badge ui-badge-${variant}`}>
      {children}
    </span>
  )
}
