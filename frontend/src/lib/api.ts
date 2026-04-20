import axios from 'axios'
import type { ATSAnalysis, NLPAnalysis, ResumeData } from '../types/resume'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  timeout: 60_000,
})

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().clearSession()
    }
    return Promise.reject(error)
  }
)

export interface GenerateResponse {
  html: string
  ats: ATSAnalysis
}

export interface ExtractResponse {
  resume_data: ResumeData
  source: string
}

export interface ImproveResponse {
  improved: string
  changes_made: string[]
}

export interface ExportDocxResponse {
  data: Blob
}

export interface AuthResponse {
  ok: boolean
  access_token: string
  token_type: string
  email: string
}

export interface CurrentUserResponse {
  ok: boolean
  email: string
}

export type KeywordAnalysisResponse = NLPAnalysis

export interface LoginParams {
  email: string
  password: string
}

export interface SavedProfileSummary {
  id: string
  name: string
  updated_at: string
}

export interface SavedProfileRecord {
  id: string
  name: string
  updated_at: string
  resume_data: ResumeData
  template_id: string
  color_scheme: string
  job_description: string
}

export interface SaveProfileParams {
  name: string
  resume_data: ResumeData
  template_id: string
  color_scheme: string
  job_description: string
}

export const resumeApi = {
  register: async (params: LoginParams): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', params)
    return data
  },

  login: async (params: LoginParams): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', params)
    return data
  },

  me: async (): Promise<CurrentUserResponse> => {
    const { data } = await api.get<CurrentUserResponse>('/auth/me')
    return data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  generate: async (params: {
    resume_data: ResumeData
    template_id: string
    color_scheme: string
    job_description: string
  }): Promise<GenerateResponse> => {
    const { data } = await api.post<GenerateResponse>('/resume/generate', params)
    return data
  },

  atsOnly: async (params: {
    resume_data: ResumeData
    template_id: string
    color_scheme: string
    job_description: string
  }): Promise<ATSAnalysis> => {
    const { data } = await api.post<ATSAnalysis>('/resume/ats', params)
    return data
  },

  improve: async (params: {
    content: string
    context?: string
    job_description?: string
    mode: 'bullets' | 'summary' | 'general'
  }): Promise<ImproveResponse> => {
    const { data } = await api.post<ImproveResponse>('/resume/improve', params)
    return data
  },

  extractFile: async (file: File): Promise<ExtractResponse> => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<ExtractResponse>('/extract/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  exportDocx: async (params: { resume_data: ResumeData }): Promise<Blob> => {
    const { data } = await api.post('/resume/export/docx', params, {
      responseType: 'blob',
    })
    return data
  },

  analyzeKeywords: async (params: {
    resume_data: ResumeData
    template_id: string
    color_scheme: string
    job_description: string
  }): Promise<KeywordAnalysisResponse> => {
    const { data } = await api.post<KeywordAnalysisResponse>('/resume/keywords', params)
    return data
  },

  listProfiles: async (): Promise<SavedProfileSummary[]> => {
    const { data } = await api.get<SavedProfileSummary[]>('/profiles')
    return data
  },

  getProfile: async (id: string): Promise<SavedProfileRecord> => {
    const { data } = await api.get<SavedProfileRecord>(`/profiles/${id}`)
    return data
  },

  createProfile: async (params: SaveProfileParams): Promise<SavedProfileSummary> => {
    const { data } = await api.post<SavedProfileSummary>('/profiles', params)
    return data
  },

  updateProfile: async (id: string, params: SaveProfileParams): Promise<SavedProfileSummary> => {
    const { data } = await api.put<SavedProfileSummary>(`/profiles/${id}`, params)
    return data
  },

  deleteProfile: async (id: string): Promise<void> => {
    await api.delete(`/profiles/${id}`)
  },
}
