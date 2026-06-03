import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Home, Menu, X, Activity, LogIn, UserPlus } from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="px-6 py-4 flex items-center bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl sticky top-0 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className="ml-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-white" />
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-white hover:text-slate-200 transition-colors"
          >
            Log<span className="text-slate-300">Monitor</span>
          </Link>
        </div>
      </header>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-slate-950 text-white shadow-2xl shadow-black/50 z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-white" />
            <span className="text-lg font-bold text-white">
              Log<span className="text-slate-300">Monitor</span>
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-1">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
            activeProps={{
              className:
                'flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-all duration-200',
            }}
          >
            <Home size={18} />
            <span className="font-medium">Home</span>
          </Link>
          <Link
            to="/projects"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
            activeProps={{
              className:
                'flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-all duration-200',
            }}
          >
            <Activity size={18} />
            <span className="font-medium">Projects</span>
          </Link>

          <Link
            to="/login"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
            activeProps={{
              className:
                'flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-all duration-200',
            }}
          >
            <LogIn size={18} />
            <span className="font-medium">Login</span>
          </Link>

          <Link
            to="/register"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
            activeProps={{
              className:
                'flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-all duration-200',
            }}
          >
            <UserPlus size={18} />
            <span className="font-medium">Register</span>
          </Link>
        </nav>

        <div className="px-6 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-600">Log Monitor v1.0</p>
        </div>
      </aside>
    </>
  )
}