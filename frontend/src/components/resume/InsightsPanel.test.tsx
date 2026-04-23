import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InsightsPanel } from './InsightsPanel'
import { resumeApi } from '../../lib/api'
import { useResumeStore } from '../../stores/resumeStore'

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
  },
}))

vi.mock('../../lib/api', () => ({
  resumeApi: {
    getResumeInsights: vi.fn(),
  },
}))

describe('InsightsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useResumeStore.getState().reset()
  })

  it('renders insights data after running analysis', async () => {
    const user = userEvent.setup()

    vi.mocked(resumeApi.getResumeInsights).mockResolvedValue({
      overall_completeness: 84,
      section_word_counts: {
        summary: 42,
        experience: 160,
        projects: 60,
        skills: 12,
      },
      strengths: ['Strong technical breadth across tools and platforms.'],
      gaps: ['Project section is empty; add at least one proof-of-work project.'],
      recommendations: ['Mirror language from the job description in summary and top bullets.'],
    })

    render(<InsightsPanel />)

    await user.click(screen.getByRole('button', { name: 'Run Insights' }))

    await waitFor(() => {
      expect(resumeApi.getResumeInsights).toHaveBeenCalledTimes(1)
    })

    expect(await screen.findByText('84%')).toBeInTheDocument()
    expect(screen.getByText('Strong technical breadth across tools and platforms.')).toBeInTheDocument()
    expect(screen.getByText('Mirror language from the job description in summary and top bullets.')).toBeInTheDocument()
  })
})
