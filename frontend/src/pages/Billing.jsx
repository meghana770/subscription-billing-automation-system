import { useEffect, useState } from 'react'
import { RefreshCw, Play, Receipt, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import api from '../api'

export default function Billing() {
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [scanResult, setScanResult] = useState(null)

  const loadCycles = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/billing/cycles')
      setCycles(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load billing cycles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCycles()
  }, [])

  const runBillingScan = async () => {
    if (!window.confirm('Are you sure you want to run the billing scan?')) return

    setScanning(true)
    setError('')
    setScanResult(null)

    try {
      const response = await api.post('/billing/run-scan')
      setScanResult(response.data)
      await loadCycles()
    } catch (err) {
      setError(err.response?.data?.detail || 'Billing scan failed.')
    } finally {
      setScanning(false)
    }
  }

  const statusStyle = (status) => {
    const styles = {
      pending: 'bg-amber-50 text-amber-700',
      invoiced: 'bg-green-50 text-green-700',
    }

    return styles[status] || 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor billing cycles and recurring revenue operations.
          </p>
        </div>

        <button
          onClick={runBillingScan}
          disabled={scanning}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          <Play size={17} />
          {scanning ? 'Running Scan...' : 'Run Billing Scan'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      )}

      {scanResult && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <div className="mb-4 flex items-center gap-2 font-semibold text-green-800">
            <CheckCircle size={20} />
            Billing Scan Completed
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Trials Converted', scanResult.trials_converted],
              ['Renewals Created', scanResult.renewals_created],
              ['Cancellations Applied', scanResult.cancellations_applied],
              ['Invoice Jobs Dispatched', scanResult.invoice_jobs_dispatched],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {value ?? 0}
                </p>
              </div>
            ))}
          </div>

          {scanResult.errors?.length > 0 && (
            <div className="mt-4 text-sm text-red-700">
              Scan errors: {JSON.stringify(scanResult.errors)}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Billing Cycles</p>
            <Receipt className="text-indigo-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{cycles.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Pending</p>
            <Clock className="text-amber-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {cycles.filter((cycle) => cycle.status === 'pending').length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Invoiced</p>
            <CheckCircle className="text-green-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {cycles.filter((cycle) => cycle.status === 'invoiced').length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-semibold text-slate-900">Billing Cycle History</h2>
            <p className="mt-1 text-xs text-slate-500">
              Records of subscription billing periods.
            </p>
          </div>

          <button
            onClick={loadCycles}
            disabled={loading}
            className="rounded-lg p-2 hover:bg-slate-100"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading billing cycles...</p>
        ) : error && cycles.length === 0 ? (
          <div className="p-8 text-center text-red-600">
            <AlertCircle className="mx-auto mb-2" />
            Unable to retrieve billing cycles.
          </div>
        ) : cycles.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No billing cycles found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Cycle ID</th>
                  <th className="px-5 py-4">Subscription</th>
                  <th className="px-5 py-4">Plan ID</th>
                  <th className="px-5 py-4">Cycle Number</th>
                  <th className="px-5 py-4">Period Start</th>
                  <th className="px-5 py-4">Period End</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {cycles.map((cycle) => (
                  <tr key={cycle.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      #{cycle.id}
                    </td>
                    <td className="px-5 py-4">#{cycle.subscription_id}</td>
                    <td className="px-5 py-4">#{cycle.plan_id}</td>
                    <td className="px-5 py-4">{cycle.cycle_number}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {cycle.period_start
                        ? new Date(cycle.period_start).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {cycle.period_end
                        ? new Date(cycle.period_end).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(cycle.status)}`}>
                        {cycle.status}
                      </span>
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