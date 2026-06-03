import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button'
import ProjectList from '../components/ProjectList'
import CreateProjectForm from '../components/CreateProjectForm'

export const Route = createFileRoute('/projects')({ component: ProjectsPage })

interface Project {
  id: string
  name: string
  createdDate: string
  logFileCount: number
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/project', { headers: getAuthHeaders() })
      if (res.status === 401) {
        // Token missing or expired — redirect to login
        navigate({ to: '/login' })
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      // Backend returns { projects: [{ project_id, name, created_at }] }
      // Map to the shape expected by ProjectList
      const mapped: Project[] = (data.projects ?? []).map(
        (p: { project_id: string; name: string; created_at: string; log_file_count: number }) => ({
          id: p.project_id,
          name: p.name,
          createdDate: p.created_at,
          logFileCount: p.log_file_count ?? 0,
        })
      )
      setProjects(mapped)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
      setError('Failed to load projects. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProjectCreated = () => {
    setShowCreateForm(false)
    fetchProjects()
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-10 h-10 text-slate-100" />
            <h1 className="text-5xl font-bold text-white">Log Monitoring System</h1>
          </div>
          <p className="text-xl text-gray-400 ml-13">
            Create and manage your log analysis projects
          </p>
        </div>

        {/* Create Project Section */}
        {!showCreateForm && (
          <div className="mb-16">
            <InteractiveHoverButton
              text="Create New Project"
              onClick={() => setShowCreateForm(true)}
              className="w-full md:w-auto"
            />
          </div>
        )}

        {showCreateForm && (
          <div className="mb-16">
            <CreateProjectForm
              onProjectCreated={handleProjectCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Existing Projects Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              Your Projects {projects.length > 0 && `(${projects.length})`}
            </h2>
            <p className="text-gray-400 mt-2">
              {projects.length === 0
                ? 'No projects yet. Create your first project to get started.'
                : 'Click on a project to view its dashboard and logs.'}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-slate-600/40 border-t-slate-100 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your projects...</p>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm border-2 border-dashed border-slate-700 rounded-lg p-16 text-center">
              <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg font-medium mb-2">No projects yet</p>
              <p className="text-gray-500 mb-6">
                Create your first project by clicking the button below to start uploading and analyzing logs.
              </p>
              <InteractiveHoverButton
                text="Create"
                onClick={() => setShowCreateForm(true)}
              />
            </div>
          ) : (
            <ProjectList projects={projects} />
          )}
        </div>
      </div>
    </div>
  )
}
