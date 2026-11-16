import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, Link, useNavigate, Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import Overview from './pages/Overview'
import Customers from './pages/Customers'
import Subscriptions from './pages/Subscriptions'
import Billing from './pages/Billing'
import ActivityLogs from './pages/ActivityLogs'


import { ShieldCheck, CreditCard, Mail, Lock, User, ArrowRight } from 'lucide-react'
import api from './api'
import Plans from './pages/Plans'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/signin', form)
      sessionStorage.setItem('access_token', response.data.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your subscriptions.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input icon={<Mail size={18} />} label="Email address" type="email"
          value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Input icon={<Lock size={18} />} label="Password" type="password"
          value={form.password} onChange={(v) => setForm({ ...form, password: v })} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button disabled={loading} className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Signing in...' : 'Sign in'}
          <ArrowRight className="ml-2 inline" size={18} />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account? <Link to="/signup" className="font-semibold text-indigo-600">Create account</Link>
      </p>
    </AuthLayout>
  )
}

function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/auth/signup', form)
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Get started with subscription management.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input icon={<User size={18} />} label="Full name" type="text"
          value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Input icon={<Mail size={18} />} label="Email address" type="email"
          value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Input icon={<Lock size={18} />} label="Password (minimum 8 characters)" type="password"
          value={form.password} onChange={(v) => setForm({ ...form, password: v })} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button disabled={loading} className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered? <Link to="/login" className="font-semibold text-indigo-600">Sign in</Link>
      </p>
    </AuthLayout>
  )
}

function Input({ icon, label, type, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <span className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-indigo-500">
        <span className="text-slate-400">{icon}</span>
        <input required type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        />
      </span>
    </label>
  )
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600 p-3 text-white"><CreditCard size={25} /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">SubscriptFlow</h1>
            <p className="text-xs text-slate-500">Billing Automation</p>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 mb-7 text-sm text-slate-500">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}

function DashboardLayout() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    api.get('/auth/me')
      .then((response) => setUser(response.data))
      .catch(() => {
        sessionStorage.removeItem('access_token')
        navigate('/login', { replace: true })
      })
  }, [navigate])

  const logout = () => {
    sessionStorage.removeItem('access_token')
    navigate('/login')
  }

  if (!user) {
    return <div className="p-8 text-slate-500">Loading dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        onLogout={logout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-white px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">
                {user.name}
              </p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  return sessionStorage.getItem('access_token')
    ? children
    : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="plans" element={<Plans />} />
        <Route path="customers" element={<Customers />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="billing" element={<Billing />} />
        <Route path="activity" element={<ActivityLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App