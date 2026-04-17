import toast from 'react-hot-toast'
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

  const generate = async () => {
    if (!resume.contact.name.trim()) {
      toast.error('Please enter your name first')
      return false
    }

    setGenerating(true)
    const tid = toast.loading('Generating your resume…')

    try {
      const res = await resumeApi.generate({
        resume_data: resume as any,
        template_id: templateId,
        color_scheme: colorScheme,
        job_description: jobDescription,
      })
      setGeneratedHtml(res.html)
      setAts(res.ats)
      toast.success('Resume generated!', { id: tid })
      return true
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        (err?.code === 'ERR_NETWORK'
          ? 'Cannot reach backend — is it running on :8000?'
          : 'Generation failed')
      toast.error(msg, { id: tid })
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
<\/script>
</body>
</html>`)
    win.document.close()
  }

  return { generate, downloadPDF, isGenerating }
}
