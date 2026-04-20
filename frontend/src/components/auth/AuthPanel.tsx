import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AxiosError } from 'axios'
import { resumeApi } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'

function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    return (err.response?.data as { detail?: string } | undefined)?.detail ?? 'Authentication failed'
  }
  return 'Authentication failed'
}

export function AuthPanel() {
  const { email, token, isAuthenticated, setSession, clearSession } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [formEmail, setFormEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const syncSession = async () => {
      if (!token || email) return
      try {
        const me = await resumeApi.me()
        if (token) setSession(me.email, token)
      } catch {
        clearSession()
      }
    }

    syncSession()
  }, [email, token, setSession, clearSession])

  const submit = async () => {
    if (!formEmail.trim() || !password.trim()) {
      toast.error('Enter email and password')
      return
    }

    setBusy(true)
    const tid = toast.loading(mode === 'login' ? 'Signing in…' : 'Creating account…')

    try {
      const action = mode === 'login' ? resumeApi.login : resumeApi.register
      const res = await action({ email: formEmail.trim(), password })
      setSession(res.email, res.access_token)
      toast.success(mode === 'login' ? 'Signed in' : 'Account created', { id: tid })
      setPassword('')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err), { id: tid })
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    setBusy(true)
    try {
      await resumeApi.logout()
    } catch {
      // ignore logout errors; session is local and can still be cleared
    } finally {
      clearSession()
      setBusy(false)
    }
  }

  if (isAuthenticated) {
    return (
      <div style={{ margin: '12px 12px 8px', padding: 12, border: '1px solid #2a2a3a', borderRadius: 12, background: '#1a1a24', display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#71717a' }}>Signed in</div>
        <div style={{ fontSize: 13, color: '#e4e4e7', wordBreak: 'break-word' }}>{email}</div>
        <button className="btn btn-ghost btn-sm" onClick={logout} disabled={busy}>
          Logout
        </button>
      </div>
    )
  }

  return (
    <div style={{ margin: '12px 12px 8px', padding: 12, border: '1px solid #2a2a3a', borderRadius: 12, background: '#1a1a24', display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#71717a' }}>Authentication</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ flex: 1, background: mode === 'login' ? 'rgba(108,99,255,0.16)' : 'transparent' }}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          className="btn btn-ghost btn-sm"
          style={{ flex: 1, background: mode === 'register' ? 'rgba(108,99,255,0.16)' : 'transparent' }}
          onClick={() => setMode('register')}
        >
          Register
        </button>
      </div>
      <input className="input" placeholder="Email" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
      <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy}>
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </button>
      <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.5 }}>
        AI generation, DOCX export, and keyword analysis require a signed-in session.
      </div>
    </div>
  )
}