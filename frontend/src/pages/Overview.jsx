import { useEffect, useState } from 'react'
import {
  Users,
  Package,
  Repeat,
  CalendarDays,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react'
import api from '../api'

export default function Overview() {
  const [data, setData] = useState({
    customers: [],
    plans: [],
    subscriptions: [],
    cycles: [],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const [customers, plans, subscriptions, cycles] = await Promise.all([
        api.get('/customers'),
        api.get('/plans'),
        api.get('/subscriptions'),
        api.get('/billing/cycles'),
      ])

      setData({
        customers: customers.data,
        plans: plans.data,
        subscriptions: subscriptions.data,
        cycles: cycles.data,
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const stats = [
    {
      label: 'Total Customers',
      value: data.customers.length,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Active Plans',
      value: data.plans.filter((p) => p.status === 'active').length,
      icon: Package,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Total Subscriptions',
      value: data.subscriptions.length,
      icon: Repeat,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Billing Cycles',
      value: data.cycles.length,
      icon: CalendarDays,
      color: 'bg-emerald-50 text-emerald-600',
    },
  ]

  const statusCounts = data.subscriptions.reduce((acc, sub) => {
    acc[sub.status] = (acc[sub.status] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return <div className="p-8 text-slate-500">Loading dashboard data...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor your subscription business.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{label}</span>
              <div className={`rounded-xl p-3 ${color}`}>
                <Icon size={21} />
              </div>
            </div>
            <p className="mt-5 text-3xl font-bold text-slate-900">{value}</p>
            <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
              <ArrowUpRight size={14} />
              Current database records
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Subscription Status
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Breakdown of your subscriptions.
          </p>

          <div className="mt-6 space-y-4">
            {Object.entries(statusCounts).length === 0 ? (
              <p className="text-sm text-slate-400">No subscriptions available.</p>
            ) : (
              Object.entries(statusCounts).map(([status, count]) => (
                <div key={status}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="capitalize text-slate-600">
                      {status.replaceAll('_', ' ')}
                    </span>
                    <span className="font-semibold text-slate-900">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{
                        width: `${(count / data.subscriptions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Recent Subscriptions
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Latest subscription records.
          </p>

          <div className="mt-5 space-y-4">
            {data.subscriptions.length === 0 ? (
              <p className="text-sm text-slate-400">No subscriptions available.</p>
            ) : (
              [...data.subscriptions]
                .sort((a, b) => b.id - a.id)
                .slice(0, 5)
                .map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-slate-800">
                        Subscription #{sub.id}
                      </p>
                      <p className="text-xs text-slate-400">
                        Customer #{sub.customer_id} · Plan #{sub.plan_id}
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium capitalize text-indigo-700">
                      {sub.status.replaceAll('_', ' ')}
                    </span>
                  </div>
                ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}