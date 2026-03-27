import { Link, NavLink, Outlet } from 'react-router-dom'
import { BrainCircuit } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/import', label: 'Import API Quiz' },
  { to: '/create', label: 'Create Custom Quiz' },
]

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_5%_5%,#fef3c7_0,#fef3c7_8%,transparent_30%),radial-gradient(circle_at_90%_10%,#dbeafe_0,#dbeafe_12%,transparent_35%),linear-gradient(135deg,#fff7ed_0%,#f8fafc_55%,#ecfeff_100%)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
            <span className="rounded-xl bg-amber-300 p-2 text-slate-900">
              <BrainCircuit className="h-5 w-5" />
            </span>
            Quiz Builder
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
