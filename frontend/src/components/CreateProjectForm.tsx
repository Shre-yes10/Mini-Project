import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Upload, X, FileUp, CheckCircle } from 'lucide-react'
import { InteractiveHoverButton } from './ui/interactive-hover-button'
import { DottedGlowCard } from './ui/dotted-glow-card'

interface CreateProjectFormProps {
  onProjectCreated: () => void
  onCancel: () => void
}

export default function CreateProjectForm({
  onProjectCreated,
  onCancel,
}: CreateProjectFormProps) {
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
      setError('')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files))
      setError('')
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }
    if (files.length === 0) {
      setError('Please select at least one log file')
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append('name', projectName)
      files.forEach((file) => formData.append('files', file))

      const token = localStorage.getItem('access_token')
      const res = await fetch('/api/project', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data?.error ?? data?.message ?? 'Failed to create project.')
        return
      }

      // Backend returns { project_id, embedding_started }
      if (data.project_id) {
        navigate({ to: `/project/${data.project_id}` })
      } else {
        onProjectCreated()
      }
    } catch (err) {
      setError('Failed to create project. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DottedGlowCard className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Create New Project</h2>
          <p className="text-gray-400 mt-1">Upload log files and start analyzing</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          disabled={loading}
        >
          <X className="w-6 h-6 text-gray-400 hover:text-white" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <X className="w-5 h-5" />
            </div>
            <span>{error}</span>
          </div>
        )}

        {/* Project Name */}
        <div>
          <label className="block text-white font-semibold mb-3">Project Name *</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., Payment Service Logs"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all"
            disabled={loading}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-white font-semibold mb-3">Upload Log Files *</label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive
                ? 'border-slate-200 bg-slate-900'
                : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
              }`}
          >
            <input
              type="file"
              multiple
              accept=".json,.txt,.log"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
              disabled={loading}
            />
            <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center">
              <div className="bg-slate-700 rounded-full p-4 mb-4">
                <Upload className="w-8 h-8 text-slate-100" />
              </div>
              <span className="text-white font-semibold text-lg">
                Click to upload or drag and drop
              </span>
              <span className="text-gray-400 text-sm mt-2">
                Supported formats: JSON, TXT, LOG (Multiple files supported)
              </span>
            </label>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-slate-100">
                <CheckCircle className="w-5 h-5" />
                <p className="font-semibold">
                  {files.length} file{files.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-700/70 hover:bg-slate-700 rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileUp className="w-5 h-5 text-slate-100 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-gray-300 text-sm truncate font-medium">{file.name}</p>
                        <p className="text-gray-500 text-xs">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 ml-2 p-1"
                      disabled={loading}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-slate-700">
          <InteractiveHoverButton
            type="submit"
            disabled={loading}
            text={loading ? 'Creating…' : 'Create Project'}
            className="flex-1 w-auto"
          />
          <InteractiveHoverButton
            type="button"
            onClick={onCancel}
            disabled={loading}
            text="Cancel"
            variant="danger"
            className="w-36"
          />
        </div>
      </form>
    </DottedGlowCard>
  )
}
