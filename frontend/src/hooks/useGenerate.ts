import toast from 'react-hot-toast'
import { AxiosError } from 'axios'
import { useResumeStore } from '../stores/resumeStore'
import { resumeApi } from '../lib/api'

export function useGenerate() {
  const {
    resume,
    templateId,
    colorScheme,
    jobDescription,
    setGeneratedHtml,
    setAts,
    setGenerating,
    isGenerating,
  } = useResumeStore()

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof AxiosError) {
      const detail = err.response?.data as { detail?: string } | undefined
      return (
        detail?.detail ??
        (err.code === 'ERR_NETWORK'
          ? 'Cannot reach backend — is it running on :8000?'
          : 'Generation failed')
      )
    }
    return 'Generation failed'
  }

  const generate = async () => {
    if (!resume.contact.name.trim()) {
      toast.error('Please enter your name first')
      return false
    }

    setGenerating(true)
    const tid = toast.loading('Generating your resume…')

    try {
      const res = await resumeApi.generate({
        resume_data: resume,
        template_id: templateId,
        color_scheme: colorScheme,
        job_description: jobDescription,
      })
      setGeneratedHtml(res.html)
      setAts(res.ats)
      toast.success('Resume generated!', { id: tid })
      return true
    } catch (err: unknown) {
      toast.error(getErrorMessage(err), { id: tid })
      return false
    } finally {
      setGenerating(false)
    }
  }

  const downloadPDF = () => {
    const { generatedHtml, resume: r } = useResumeStore.getState()
    if (!generatedHtml) {
      toast.error('Generate your resume first')
      return
    }
    const name = r.contact.name || 'Resume'
    const win = window.open('', '_blank')
    if (!win) {
      toast.error('Allow pop-ups to download PDF')
      return
    }
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${name} — Resume</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    @media print {
      @page { margin: 0; size: A4; }
      body { margin: 0; }
    }
  </style>
</head>
<body>
${generatedHtml}
<script>
  window.onload = () => { setTimeout(() => { window.print(); }, 400); };
</script>
</body>
</html>`)
    win.document.close()
  }

  const downloadDocx = async () => {
    const { resume: r } = useResumeStore.getState()
    if (!r.contact.name.trim()) {
      toast.error('Add a name before exporting DOCX')
      return
    }

    const tid = toast.loading('Preparing DOCX export…')
    try {
      const blob = await resumeApi.exportDocx({ resume_data: r })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${r.contact.name || 'resume'}.docx`.replaceAll('/', '_')
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success('DOCX export ready!', { id: tid })
    } catch (err: unknown) {
      toast.error(getErrorMessage(err), { id: tid })
    }
  }

  return { generate, downloadPDF, downloadDocx, isGenerating }
}
