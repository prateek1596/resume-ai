import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ResumeData, ATSAnalysis } from '../types/resume'
import { emptyResume, makeId } from '../types/resume'

interface ResumeStore {
  // Data
  resume: ResumeData
  templateId: string
  colorScheme: string
  jobDescription: string

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

  addEducation: () => void
  updateEducation: (id: string, field: string, value: string) => void
  removeEducation: (id: string) => void

  addCertification: () => void
  updateCertification: (id: string, field: string, value: string) => void
  removeCertification: (id: string) => void

  addLanguage: () => void
  updateLanguage: (id: string, field: string, value: string) => void
  removeLanguage: (id: string) => void

  addProject: () => void
  updateProject: (id: string, field: string, value: unknown) => void
  removeProject: (id: string) => void

  addSkill: (type: 'technical' | 'soft', skill: string) => void
  removeSkill: (type: 'technical' | 'soft', skill: string) => void

  // Config
  setTemplate: (id: string) => void
  setColorScheme: (id: string) => void
  setJobDescription: (v: string) => void

  // Async results
  setGeneratedHtml: (html: string) => void
  setAts: (ats: ATSAnalysis) => void
  setGenerating: (v: boolean) => void
  setExtracting: (v: boolean) => void

  // Bulk import
  importResume: (data: Partial<ResumeData>) => void

  // Reset
  reset: () => void
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      resume: emptyResume(),
      templateId: 'executive',
      colorScheme: 'classic',
      jobDescription: '',
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
      setJobDescription: v => set({ jobDescription: v }),

      setGeneratedHtml: html => set({ generatedHtml: html }),
      setAts: ats => set({ ats }),
      setGenerating: v => set({ isGenerating: v }),
      setExtracting: v => set({ isExtracting: v }),

      importResume: data =>
        set(s => {
          const addIds = <T extends object>(arr: T[] = []) =>
            arr.map(item => ({ id: makeId(), ...item }))
          return {
            resume: {
              ...s.resume,
              ...data,
              contact: { ...s.resume.contact, ...(data.contact ?? {}) },
              experiences: addIds(data.experiences as any),
              educations: addIds(data.educations as any),
              certifications: addIds(data.certifications as any),
              languages: addIds(data.languages as any),
              projects: addIds(data.projects as any),
              skills: data.skills ?? s.resume.skills,
            },
          }
        }),

      reset: () => set({ resume: emptyResume(), generatedHtml: '', ats: null }),
    }),
    { name: 'resumeai-store', version: 1 }
  )
)
