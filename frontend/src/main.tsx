import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Toaster
      position="bottom-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1a1a24',
          color: '#e4e4e7',
          border: '1px solid #2a2a3a',
          fontSize: 13,
          fontFamily: 'DM Sans, system-ui, sans-serif',
          borderRadius: 8,
          padding: '10px 14px',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#1a1a24' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#1a1a24' }, duration: 6000 },
        loading: { iconTheme: { primary: '#6c63ff', secondary: '#1a1a24' } },
      }}
    />
  </React.StrictMode>,
)
