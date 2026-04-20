export interface ContactInfo {
  name: string
  title: string
  email: string
  phone: string
  location: string
  linkedin: string
  portfolio: string
  website: string
}

export interface ExperienceItem {
  id: string
  company: string
  role: string
  start: string
  end: string
  bullets: string[]
}

export interface EducationItem {
  id: string
  school: string
  degree: string
  field: string
  year: string
  gpa: string
}

export interface CertificationItem {
  id: string
  name: string
  issuer: string
  year: string
  url: string
}

export interface LanguageItem {
  id: string
  language: string
  level: string
}

export interface ProjectItem {
  id: string
  name: string
  description: string
  technologies: string
  url: string
  bullets: string[]
}

export interface Skills {
  technical: string[]
  soft: string[]
}

export interface ResumeData {
  contact: ContactInfo
  summary: string
  experiences: ExperienceItem[]
  educations: EducationItem[]
  skills: Skills
  certifications: CertificationItem[]
  languages: LanguageItem[]
  projects: ProjectItem[]
  photo_base64?: string | null
}

export interface ATSSuggestion {
  type: 'add' | 'remove' | 'improve'
  category: 'keywords' | 'format' | 'content' | 'length' | 'structure'
  text: string
  priority: 'high' | 'medium' | 'low'
}

export interface ATSAnalysis {
  score: number
  breakdown: Record<string, number>
  suggestions: ATSSuggestion[]
  matched_keywords: string[]
  missing_keywords: string[]
}

export interface Template {
  id: string
  name: string
  description: string
  hasPhoto: boolean
  category: 'modern' | 'classic' | 'creative' | 'minimal' | 'ats'
}

export const TEMPLATES: Template[] = [
  { id: 'executive',  name: 'Executive',    description: 'Bold header · Photo · Classic',   hasPhoto: true,  category: 'modern'   },
  { id: 'minimal',    name: 'Minimal',      description: 'Clean · No photo · Accent bar',   hasPhoto: false, category: 'minimal'  },
  { id: 'split',      name: 'Modern Split', description: 'Sidebar · Photo · Two-column',    hasPhoto: true,  category: 'modern'   },
  { id: 'classic',    name: 'Classic Pro',  description: 'Traditional · No photo · Rules',  hasPhoto: false, category: 'classic'  },
  { id: 'creative',   name: 'Creative',     description: 'Sidebar · Photo · Contemporary',  hasPhoto: true,  category: 'creative' },
  { id: 'tech',       name: 'Tech',         description: 'Dark header · No photo · Dev',    hasPhoto: false, category: 'modern'   },
  { id: 'elegant',    name: 'Elegant',      description: 'Centered · Photo · Refined',      hasPhoto: true,  category: 'classic'  },
  { id: 'sharp',      name: 'Sharp',        description: 'Angled · No photo · Bold',        hasPhoto: false, category: 'creative' },
  { id: 'timeline',   name: 'Timeline',     description: 'Dots · Photo · Chronological',    hasPhoto: true,  category: 'modern'   },
  { id: 'ats_pure',   name: 'ATS Pure',     description: 'Text-only · No photo · Max ATS',  hasPhoto: false, category: 'ats'      },
  { id: 'bento',      name: 'Bento',        description: 'Card grid · Photo · Modern',      hasPhoto: true,  category: 'modern'   },
  { id: 'monograph',  name: 'Monograph',    description: 'Editorial · No photo · Serif',    hasPhoto: false, category: 'classic'  },
  { id: 'duo',        name: 'Duo',          description: 'Split rail · Photo · Compact',    hasPhoto: true,  category: 'modern'   },
]

export const COLOR_SCHEMES = [
  { id: 'classic',  label: 'Classic',  swatch: '#6c63ff' },
  { id: 'navy',     label: 'Navy',     swatch: '#3b82f6' },
  { id: 'emerald',  label: 'Emerald',  swatch: '#10b981' },
  { id: 'crimson',  label: 'Crimson',  swatch: '#dc2626' },
  { id: 'slate',    label: 'Slate',    swatch: '#475569' },
  { id: 'gold',     label: 'Gold',     swatch: '#b45309' },
]

export function emptyResume(): ResumeData {
  return {
    contact: { name: '', title: '', email: '', phone: '', location: '', linkedin: '', portfolio: '', website: '' },
    summary: '',
    experiences: [],
    educations: [],
    skills: { technical: [], soft: [] },
    certifications: [],
    languages: [],
    projects: [],
    photo_base64: null,
  }
}

export function makeId() {
  return Math.random().toString(36).slice(2, 9)
}
