import { useNavigate } from '@tanstack/react-router'
import { FileText, Calendar, ChevronRight, Files } from 'lucide-react'
import { InteractiveHoverButton } from './ui/interactive-hover-button'

interface Project {
  id: string
  name: string
  createdDate: string
  logFileCount: number
}

interface ProjectListProps {
  projects: Project[]
}

export default function ProjectList({ projects }: ProjectListProps) {
  const navigate = useNavigate()

  const handleOpenProject = (projectId: string) => {
    navigate({ to: `/project/${projectId}` })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          className="group bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-lg p-6 hover:border-slate-300 transition-all duration-300 hover:shadow-lg hover:shadow-black/40 hover:bg-slate-900"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white group-hover:text-slate-100 transition-colors line-clamp-2">
                {project.name}
              </h3>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-slate-100 transition-colors flex-shrink-0 ml-2" />
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-gray-400">
              <Calendar className="w-4 h-4 text-slate-200 flex-shrink-0" />
              <span className="text-sm">Created {formatDate(project.createdDate)}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <Files className="w-4 h-4 text-slate-200 flex-shrink-0" />
              <span className="text-sm">
                {project.logFileCount} log {project.logFileCount === 1 ? 'file' : 'files'}
              </span>
            </div>
          </div>

          <InteractiveHoverButton
            text="Open"
            onClick={() => handleOpenProject(project.id)}
            className="w-full"
          />
        </div>
      ))}
    </div>
  )
}
