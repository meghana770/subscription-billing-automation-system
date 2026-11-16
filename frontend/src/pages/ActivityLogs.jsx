import { useEffect, useState } from 'react'
import { Activity, RefreshCw, Search, Clock } from 'lucide-react'
import api from '../api'

export default function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const loadLogs = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/audit-logs')
      setLogs(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load activity logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const filteredLogs = logs.filter((log) =>
    [
      log.action,
      log.entity_type,
      log.actor,
      log.entity_id,
      log.customer_id,
      log.subscription_id,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track important actions and changes across your subscription business.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={17} /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Activities</p>
            <Activity className="text-indigo-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{logs.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Latest Activity</p>
            <Clock className="text-indigo-600" />
          </div>
          <p className="mt-3 text-lg font-bold text-slate-900">
            {logs.length && logs[0].created_at
              ? new Date(logs[0].created_at).toLocaleString()
              : 'No activities yet'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity logs..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading activity logs...</p>
        ) : error ? (
          <p className="p-8 text-center text-red-600">{error}</p>
        ) : filteredLogs.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            No activity logs found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Activity</th>
                  <th className="px-5 py-4">Entity</th>
                  <th className="px-5 py-4">Entity ID</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Subscription</th>
                  <th className="px-5 py-4">Actor</th>
                  <th className="px-5 py-4">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {log.action}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {log.entity_type}
                    </td>
                    <td className="px-5 py-4">#{log.entity_id}</td>
                    <td className="px-5 py-4">
                      {log.customer_id ? `#${log.customer_id}` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {log.subscription_id ? `#${log.subscription_id}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {log.actor || 'System'}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}