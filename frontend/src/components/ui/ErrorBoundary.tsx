import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ResumeAI] Uncaught error:', error, info)
  }

  handleReset = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: 16,
          background: '#0a0a0f', color: '#e4e4e7',
          fontFamily: 'DM Sans, system-ui, sans-serif', padding: 32, textAlign: 'center',
        }}>
          <div style={{ fontSize: 48 }}>&#9888;&#65039;</div>
          <h2 style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: 22, margin: 0 }}>
            Something went wrong
          </h2>
          <pre style={{
            background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8,
            padding: '12px 16px', fontSize: 12, color: '#f87171',
            maxWidth: 600, overflow: 'auto', textAlign: 'left', whiteSpace: 'pre-wrap',
          }}>
            {this.state.error.message}
          </pre>
          <button
            style={{
              background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 24px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}
            onClick={this.handleReset}
          >
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
