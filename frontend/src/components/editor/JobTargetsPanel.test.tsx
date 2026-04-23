import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { JobTargetsPanel } from './JobTargetsPanel'
import { useResumeStore } from '../../stores/resumeStore'

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
  },
}))

describe('JobTargetsPanel', () => {
  beforeEach(() => {
    useResumeStore.getState().reset()
  })

  it('saves a new job target from input and description', async () => {
    const user = userEvent.setup()
    useResumeStore.setState({ jobDescription: 'Role focused on React and TypeScript' })

    render(<JobTargetsPanel />)

    await user.type(screen.getByPlaceholderText('Senior Frontend Engineer'), 'Frontend Role')
    await user.click(screen.getByRole('button', { name: 'Save Target' }))

    const state = useResumeStore.getState()
    expect(state.jobTargets).toHaveLength(1)
    expect(state.jobTargets[0].name).toBe('Frontend Role')
    expect(state.activeJobTargetId).toBe(state.jobTargets[0].id)
  })

  it('switches to a selected saved target', async () => {
    const user = userEvent.setup()
    useResumeStore.setState({
      jobTargets: [
        { id: 'a', name: 'Role A', description: 'Description A' },
        { id: 'b', name: 'Role B', description: 'Description B' },
      ],
      activeJobTargetId: 'a',
      jobDescription: 'Description A',
    })

    render(<JobTargetsPanel />)

    const useButtons = screen.getAllByRole('button', { name: 'Use' })
    await user.click(useButtons[1])

    const state = useResumeStore.getState()
    expect(state.activeJobTargetId).toBe('b')
    expect(state.jobDescription).toBe('Description B')
  })
})
