import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Users,
  Repeat,
  Receipt,
  Activity,
  CreditCard,
  LogOut,
  X,
} from 'lucide-react'

const navigation = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Plans', path: '/dashboard/plans', icon: Package },
  { name: 'Customers', path: '/dashboard/customers', icon: Users },
  { name: 'Subscriptions', path: '/dashboard/subscriptions', icon: Repeat },
  { name: 'Billing', path: '/dashboard/billing', icon: Receipt },
  { name: 'Activity Logs', path: '/dashboard/activity', icon: Activity },
]

export default function Sidebar({ onLogout, open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2">
              <CreditCard size={23} />
            </div>
            <div>
              <h1 className="text-lg font-bold">SubscriptFlow</h1>
              <p className="text-xs text-slate-400">Billing Automation</p>
            </div>
          </div>

          <button onClick={onClose} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-8 pb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workspace
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navigation.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={19} />
              {name}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={19} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}