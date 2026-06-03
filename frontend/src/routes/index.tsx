import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  FileText,
  AlertCircle,
  Search,
  MessageSquare,
  BarChart3,
  Zap,
} from 'lucide-react'
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  const navigate = useNavigate()

  const features = [
    {
      icon: <FileText className="w-10 h-10 text-slate-100" />,
      title: 'Log Ingestion',
      description:
        'Upload and automatically parse logs from multiple services. Support for JSON and text formats.',
    },
    {
      icon: <Search className="w-10 h-10 text-slate-100" />,
      title: 'Powerful Search',
      description:
        'Filter logs by level, service, time range, and keywords. Find what you need instantly.',
    },
    {
      icon: <AlertCircle className="w-10 h-10 text-slate-100" />,
      title: 'Smart Alerts',
      description:
        'Set rule-based alerts. Detect error spikes, patterns, and anomalies automatically.',
    },
    {
      icon: <BarChart3 className="w-10 h-10 text-slate-100" />,
      title: 'Real-Time Insights',
      description:
        'View summaries, error trends, and statistics at a glance. Track system health.',
    },
    {
      icon: <MessageSquare className="w-10 h-10 text-slate-100" />,
      title: 'AI Chat Analysis',
      description:
        'Ask questions about your logs. Get intelligent insights via conversational AI.',
    },
    {
      icon: <Zap className="w-10 h-10 text-slate-100" />,
      title: 'Fast & Reliable',
      description:
        'Built for performance. Process large volumes of logs with minimal latency.',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-32 px-6 text-center overflow-hidden">
        <div className="relative max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
            <span className="text-white">Monitor Logs</span>
            {' '}Like Never Before
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light max-w-3xl mx-auto">
            Intelligent log analysis, real-time alerts, and AI-powered insights for modern systems
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12">
            Upload your logs, set up smart alert rules, search across all your data, and get instant insights with AI chat analysis.
          </p>
          <InteractiveHoverButton
            text="Get Started"
            onClick={() => navigate({ to: '/login' })}
            className="w-40 mx-auto"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Everything you need to understand, monitor, and act on your log data.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-xl p-8 hover:border-slate-300 transition-all duration-300 hover:shadow-lg hover:shadow-black/40 hover:bg-slate-900"
            >
              <div className="mb-5 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slate-800 group-hover:bg-slate-700 transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-slate-100 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}