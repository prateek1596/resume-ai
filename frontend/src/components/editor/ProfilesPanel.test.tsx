import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfilesPanel } from './ProfilesPanel'
import { useResumeStore } from '../../stores/resumeStore'
import { resumeApi } from '../../lib/api'

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
  },
}))

vi.mock('../../lib/api', () => ({
  resumeApi: {
    listProfiles: vi.fn(),
    createProfile: vi.fn(),
    getProfile: vi.fn(),
    deleteProfile: vi.fn(),
  },
}))

describe('ProfilesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useResumeStore.getState().reset()
  })

  it('loads profiles list and loads selected profile into workspace', async () => {
    const user = userEvent.setup()

    vi.mocked(resumeApi.listProfiles).mockResolvedValue([
      { id: 'p1', name: 'Saved A', updated_at: '2026-04-23T10:00:00Z' },
    ])
    vi.mocked(resumeApi.getProfile).mockResolvedValue({
      id: 'p1',
      name: 'Saved A',
      updated_at: '2026-04-23T10:00:00Z',
      template_id: 'impact',
      color_scheme: 'navy',
      job_description: 'Product Engineer',
      resume_data: useResumeStore.getState().resume,
    })

    render(<ProfilesPanel />)

    await screen.findByText('Saved A')
    await user.click(screen.getByRole('button', { name: 'Load' }))

    await waitFor(() => {
      expect(useResumeStore.getState().templateId).toBe('impact')
      expect(useResumeStore.getState().colorScheme).toBe('navy')
    })
  })

  it('deletes a saved profile', async () => {
    const user = userEvent.setup()

    vi.mocked(resumeApi.listProfiles).mockResolvedValue([
      { id: 'p9', name: 'Delete Me', updated_at: '2026-04-23T10:00:00Z' },
    ])
    vi.mocked(resumeApi.deleteProfile).mockResolvedValue()

    render(<ProfilesPanel />)

    await screen.findByText('Delete Me')
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(resumeApi.deleteProfile).toHaveBeenCalledWith('p9')
      expect(screen.queryByText('Delete Me')).not.toBeInTheDocument()
    })
  })
})
