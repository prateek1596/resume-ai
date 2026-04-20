import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ATSAnalysis,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  ProjectItem,
  ResumeData,
} from '../types/resume'
import { emptyResume, makeId } from '../types/resume'

interface ResumeStore {
  // Data
  resume: ResumeData
  templateId: string
  colorScheme: string
  jobDescription: string
  jobTargets: JobTarget[]
  activeJobTargetId: string | null

  // Generated output
  generatedHtml: string
  ats: ATSAnalysis | null
  isGenerating: boolean
  isExtracting: boolean

  // Actions — contact
  setContact: (field: keyof ResumeData['contact'], value: string) => void
  setSummary: (v: string) => void
  setPhoto: (b64: string | null) => void

  // Actions — lists
  addExperience: () => void
  updateExperience: (id: string, field: string, value: unknown) => void
  removeExperience: (id: string) => void
  duplicateExperience: (id: string) => void

  addEducation: () => void
  updateEducation: (id: string, field: string, value: string) => void
  removeEducation: (id: string) => void
  duplicateEducation: (id: string) => void

  addCertification: () => void
  updateCertification: (id: string, field: string, value: string) => void
  removeCertification: (id: string) => void
  duplicateCertification: (id: string) => void

  addLanguage: () => void
  updateLanguage: (id: string, field: string, value: string) => void
  removeLanguage: (id: string) => void
  duplicateLanguage: (id: string) => void

  addProject: () => void
  updateProject: (id: string, field: string, value: unknown) => void
  removeProject: (id: string) => void
  duplicateProject: (id: string) => void

  addSkill: (type: 'technical' | 'soft', skill: string) => void
  removeSkill: (type: 'technical' | 'soft', skill: string) => void

  // Config
  setTemplate: (id: string) => void
  setColorScheme: (id: string) => void
  setJobDescription: (v: string) => void
  saveJobTarget: (name: string) => void
  selectJobTarget: (id: string) => void
  deleteJobTarget: (id: string) => void

  // Async results
  setGeneratedHtml: (html: string) => void
  setAts: (ats: ATSAnalysis) => void
  setGenerating: (v: boolean) => void
  setExtracting: (v: boolean) => void

  // Bulk import
  importResume: (data: Partial<ResumeData>) => void
  loadDemoResume: () => void

  // Reset
  reset: () => void
}

interface JobTarget {
  id: string
  name: string
  description: string
}

const DEFAULT_TEMPLATE_ID = 'executive'
const DEFAULT_COLOR_SCHEME = 'classic'

function withNewId<T extends { id: string }>(item: T): T {
  return { ...item, id: makeId() }
}

function buildDemoResume(): ResumeData {
  return {
    contact: {
      name: 'Ava Chen',
      title: 'Senior Full-Stack Engineer',
      email: 'ava.chen@example.com',
      phone: '+1 (415) 555-0138',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/avachen',
      portfolio: 'github.com/avachen',
      website: 'avachen.dev',
    },
    summary:
      'Product-minded engineer with 8+ years building web platforms, shipping AI-assisted workflows, and leading cross-functional delivery for high-growth teams.',
    experiences: [
      {
        id: makeId(),
        company: 'Northstar Labs',
        role: 'Senior Full-Stack Engineer',
        start: '2022',
        end: 'Present',
        bullets: [
          'Led a React and FastAPI platform rewrite that cut page load time by 42% and improved conversion by 18%',
          'Shipped AI-assisted resume and document workflows used by 15,000+ monthly active users',
          'Mentored 4 engineers, introduced design reviews, and reduced release regressions by 30%',
        ],
      },
      {
        id: makeId(),
        company: 'Helix Cloud',
        role: 'Software Engineer',
        start: '2019',
        end: '2022',
        bullets: [
          'Built internal tooling that automated deployment checks and saved the team 12 hours per week',
          'Partnered with product and design to redesign onboarding, increasing activation by 21%',
          'Implemented analytics dashboards and alerted on service errors before customer impact escalated',
        ],
      },
    ],
    educations: [
      {
        id: makeId(),
        school: 'University of California, Berkeley',
        degree: 'B.S.',
        field: 'Computer Science',
        year: '2019',
        gpa: '3.8',
      },
    ],
    skills: {
      technical: ['TypeScript', 'React', 'Python', 'FastAPI', 'PostgreSQL', 'AWS', 'Docker', 'LLMs'],
      soft: ['Leadership', 'Product Thinking', 'Communication', 'Mentoring'],
    },
    certifications: [
      {
        id: makeId(),
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        year: '2024',
        url: '',
      },
    ],
    languages: [
      { id: makeId(), language: 'English', level: 'Native' },
      { id: makeId(), language: 'Mandarin', level: 'Professional Working Proficiency' },
    ],
    projects: [
      {
        id: makeId(),
        name: 'ResumeAI',
        description: 'AI-powered resume builder with ATS analysis, template switching, and PDF export.',
        technologies: 'React, FastAPI, Anthropic, Zustand',
        url: 'github.com/avachen/resumeai',
        bullets: ['Designed a workflow that moves from import to polished resume in under two minutes'],
      },
      {
        id: makeId(),
        name: 'Ops Insights',
        description: 'Internal observability dashboard for release health and incident tracking.',
        technologies: 'TypeScript, PostgreSQL, Grafana',
        url: '',
        bullets: ['Helped the team spot deploy regressions earlier with trend-based alerting'],
      },
    ],
    photo_base64: null,
  }
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      resume: emptyResume(),
      templateId: DEFAULT_TEMPLATE_ID,
      colorScheme: DEFAULT_COLOR_SCHEME,
      jobDescription: '',
      jobTargets: [],
      activeJobTargetId: null,
      generatedHtml: '',
      ats: null,
      isGenerating: false,
      isExtracting: false,

      setContact: (field, value) =>
        set(s => ({ resume: { ...s.resume, contact: { ...s.resume.contact, [field]: value } } })),

      setSummary: v => set(s => ({ resume: { ...s.resume, summary: v } })),
      setPhoto: b64 => set(s => ({ resume: { ...s.resume, photo_base64: b64 } })),

      addExperience: () =>
        set(s => ({
          resume: {
            ...s.resume,
            experiences: [
              ...s.resume.experiences,
              { id: makeId(), company: '', role: '', start: '', end: 'Present', bullets: [] },
            ],
          },
        })),
      updateExperience: (id, field, value) =>
        set(s => ({
          resume: {
            ...s.resume,
            experiences: s.resume.experiences.map(e => (e.id === id ? { ...e, [field]: value } : e)),
          },
        })),
      removeExperience: id =>
        set(s => ({ resume: { ...s.resume, experiences: s.resume.experiences.filter(e => e.id !== id) } })),
      duplicateExperience: id =>
        set(s => {
          const index = s.resume.experiences.findIndex(item => item.id === id)
          if (index < 0) return s
          const duplicate = withNewId(s.resume.experiences[index])
          const experiences = [...s.resume.experiences]
          experiences.splice(index + 1, 0, duplicate)
          return { resume: { ...s.resume, experiences } }
        }),

      addEducation: () =>
        set(s => ({
          resume: {
            ...s.resume,
            educations: [...s.resume.educations, { id: makeId(), school: '', degree: '', field: '', year: '', gpa: '' }],
          },
        })),
      updateEducation: (id, field, value) =>
        set(s => ({
          resume: {
            ...s.resume,
            educations: s.resume.educations.map(e => (e.id === id ? { ...e, [field]: value } : e)),
          },
        })),
      removeEducation: id =>
        set(s => ({ resume: { ...s.resume, educations: s.resume.educations.filter(e => e.id !== id) } })),
      duplicateEducation: id =>
        set(s => {
          const index = s.resume.educations.findIndex(item => item.id === id)
          if (index < 0) return s
          const duplicate = withNewId(s.resume.educations[index])
          const educations = [...s.resume.educations]
          educations.splice(index + 1, 0, duplicate)
          return { resume: { ...s.resume, educations } }
        }),

      addCertification: () =>
        set(s => ({
          resume: {
            ...s.resume,
            certifications: [...s.resume.certifications, { id: makeId(), name: '', issuer: '', year: '', url: '' }],
          },
        })),
      updateCertification: (id, field, value) =>
        set(s => ({
          resume: {
            ...s.resume,
            certifications: s.resume.certifications.map(c => (c.id === id ? { ...c, [field]: value } : c)),
          },
        })),
      removeCertification: id =>
        set(s => ({
          resume: { ...s.resume, certifications: s.resume.certifications.filter(c => c.id !== id) },
        })),
      duplicateCertification: id =>
        set(s => {
          const index = s.resume.certifications.findIndex(item => item.id === id)
          if (index < 0) return s
          const duplicate = withNewId(s.resume.certifications[index])
          const certifications = [...s.resume.certifications]
          certifications.splice(index + 1, 0, duplicate)
          return { resume: { ...s.resume, certifications } }
        }),

      addLanguage: () =>
        set(s => ({
          resume: {
            ...s.resume,
            languages: [...s.resume.languages, { id: makeId(), language: '', level: '' }],
          },
        })),
      updateLanguage: (id, field, value) =>
        set(s => ({
          resume: {
            ...s.resume,
            languages: s.resume.languages.map(l => (l.id === id ? { ...l, [field]: value } : l)),
          },
        })),
      removeLanguage: id =>
        set(s => ({ resume: { ...s.resume, languages: s.resume.languages.filter(l => l.id !== id) } })),
      duplicateLanguage: id =>
        set(s => {
          const index = s.resume.languages.findIndex(item => item.id === id)
          if (index < 0) return s
          const duplicate = withNewId(s.resume.languages[index])
          const languages = [...s.resume.languages]
          languages.splice(index + 1, 0, duplicate)
          return { resume: { ...s.resume, languages } }
        }),

      addProject: () =>
        set(s => ({
          resume: {
            ...s.resume,
            projects: [
              ...s.resume.projects,
              { id: makeId(), name: '', description: '', technologies: '', url: '', bullets: [] },
            ],
          },
        })),
      updateProject: (id, field, value) =>
        set(s => ({
          resume: {
            ...s.resume,
            projects: s.resume.projects.map(p => (p.id === id ? { ...p, [field]: value } : p)),
          },
        })),
      removeProject: id =>
        set(s => ({ resume: { ...s.resume, projects: s.resume.projects.filter(p => p.id !== id) } })),
      duplicateProject: id =>
        set(s => {
          const index = s.resume.projects.findIndex(item => item.id === id)
          if (index < 0) return s
          const duplicate = withNewId(s.resume.projects[index])
          const projects = [...s.resume.projects]
          projects.splice(index + 1, 0, duplicate)
          return { resume: { ...s.resume, projects } }
        }),

      addSkill: (type, skill) => {
        const current = get().resume.skills[type]
        if (current.includes(skill)) return
        set(s => ({
          resume: { ...s.resume, skills: { ...s.resume.skills, [type]: [...current, skill] } },
        }))
      },
      removeSkill: (type, skill) =>
        set(s => ({
          resume: {
            ...s.resume,
            skills: { ...s.resume.skills, [type]: s.resume.skills[type].filter(sk => sk !== skill) },
          },
        })),

      setTemplate: id => set({ templateId: id }),
      setColorScheme: id => set({ colorScheme: id }),
      setJobDescription: v =>
        set(s => ({
          jobDescription: v,
          jobTargets: s.activeJobTargetId
            ? s.jobTargets.map(target => (
                target.id === s.activeJobTargetId ? { ...target, description: v } : target
              ))
            : s.jobTargets,
        })),
      saveJobTarget: name =>
        set(s => {
          const trimmedName = name.trim()
          const description = s.jobDescription.trim()
          if (!trimmedName || !description) return s

          const existingIndex = s.jobTargets.findIndex(target => target.id === s.activeJobTargetId)
          if (existingIndex >= 0) {
            const jobTargets = [...s.jobTargets]
            jobTargets[existingIndex] = { ...jobTargets[existingIndex], name: trimmedName, description }
            return { jobTargets }
          }

          const jobTarget: JobTarget = { id: makeId(), name: trimmedName, description }
          return {
            jobTargets: [...s.jobTargets, jobTarget],
            activeJobTargetId: jobTarget.id,
          }
        }),
      selectJobTarget: id =>
        set(s => {
          const target = s.jobTargets.find(item => item.id === id)
          if (!target) return s
          return {
            activeJobTargetId: target.id,
            jobDescription: target.description,
          }
        }),
      deleteJobTarget: id =>
        set(s => {
          const jobTargets = s.jobTargets.filter(target => target.id !== id)
          const nextActive = s.activeJobTargetId === id ? null : s.activeJobTargetId
          const nextTarget = nextActive ? jobTargets.find(target => target.id === nextActive) : null
          return {
            jobTargets,
            activeJobTargetId: nextActive,
            jobDescription: nextTarget?.description ?? '',
          }
        }),

      setGeneratedHtml: html => set({ generatedHtml: html }),
      setAts: ats => set({ ats }),
      setGenerating: v => set({ isGenerating: v }),
      setExtracting: v => set({ isExtracting: v }),

      importResume: data =>
        set(s => {
          const addIds = <T extends { id: string }>(arr: T[] = []) =>
            arr.map(item => ({ ...item, id: makeId() }))

          const experiences = addIds((data.experiences ?? []) as ExperienceItem[])
          const educations = addIds((data.educations ?? []) as EducationItem[])
          const certifications = addIds((data.certifications ?? []) as CertificationItem[])
          const languages = addIds((data.languages ?? []) as LanguageItem[])
          const projects = addIds((data.projects ?? []) as ProjectItem[])

          return {
            resume: {
              ...s.resume,
              ...data,
              contact: { ...s.resume.contact, ...(data.contact ?? {}) },
              experiences,
              educations,
              certifications,
              languages,
              projects,
              skills: data.skills ?? s.resume.skills,
            },
          }
        }),

      loadDemoResume: () =>
        set(() => {
          const target = {
            id: makeId(),
            name: 'Senior Full-Stack Engineer',
            description:
              'Senior full-stack engineer role focused on AI-assisted product development, React, TypeScript, Python, FastAPI, and cloud delivery.',
          }

          return {
            resume: buildDemoResume(),
            templateId: 'bento',
            colorScheme: 'emerald',
            jobDescription: target.description,
            jobTargets: [target],
            activeJobTargetId: target.id,
            generatedHtml: '',
            ats: null,
            isGenerating: false,
            isExtracting: false,
          }
        }),

      reset: () =>
        set({
          resume: emptyResume(),
          templateId: DEFAULT_TEMPLATE_ID,
          colorScheme: DEFAULT_COLOR_SCHEME,
          jobDescription: '',
          jobTargets: [],
          activeJobTargetId: null,
          generatedHtml: '',
          ats: null,
          isGenerating: false,
          isExtracting: false,
        }),
    }),
    { name: 'resumeai-store', version: 1 }
  )
)
