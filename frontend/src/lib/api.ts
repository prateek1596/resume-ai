import axios from 'axios'
import type { ResumeData, ATSAnalysis } from '../types/resume'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  timeout: 60_000,
})

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

export const resumeApi = {
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
}
