
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquareText,
  Search,
  BrainCircuit,
  ShieldCheck,
  Settings,
  Activity,
} from 'lucide-react'

const navigation = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Complaint Analysis', path: '/analyze', icon: MessageSquareText },
  { name: 'Complaint Explorer', path: '/explorer', icon: Search },
  { name: 'Model Performance', path: '/model', icon: BrainCircuit },
]

function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-[#0d1220] px-5 py-6">

      {/* Brand */}
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
          <Activity size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            SupportLens
          </h1>
          <p className="text-xs text-slate-500">
            Complaint Intelligence
          </p>
        </div>
      </div>

      {/* Navigation */}
      <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Workspace
      </p>

      <nav className="flex flex-col gap-2">
        {navigation.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`
              }
            >
              <Icon size={19} />
              {item.name}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto">
        <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck size={17} className="text-emerald-400" />
            <span className="text-sm font-medium text-slate-200">
              System Status
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Frontend initialized
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-emerald-400">Ready</span>
          </div>
        </div>

        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
