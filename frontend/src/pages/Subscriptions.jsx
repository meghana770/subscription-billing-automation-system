import { useEffect, useState } from 'react'
import { Plus, Repeat, X, Play, Pause, Ban, RefreshCw } from 'lucide-react'
import api from '../api'

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [customers, setCustomers] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showChangePlan, setShowChangePlan] = useState(null)
  const [newPlanId, setNewPlanId] = useState('')
  const [effective, setEffective] = useState('immediate')

  const [form, setForm] = useState({
    customer_id: '',
    plan_id: '',
    start_trial: true,
  })

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [subRes, custRes, planRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/customers'),
        api.get('/plans'),
      ])

      setSubscriptions(subRes.data)
      setCustomers(custRes.data)
      setPlans(planRes.data.filter((plan) => plan.status === 'active'))
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load subscriptions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const createSubscription = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await api.post('/subscriptions', {
        customer_id: Number(form.customer_id),
        plan_id: Number(form.plan_id),
        start_trial: form.start_trial,
      })

      setShowForm(false)
      setForm({ customer_id: '', plan_id: '', start_trial: true })
      await loadData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create subscription.')
    }
  }

  const performAction = async (id, action) => {
    setError('')

    if (action === 'cancel') {
      const timing = window.prompt(
        'Enter cancellation timing: immediate or end_of_cycle',
        'end_of_cycle'
      )

      if (!timing) return

      if (!['immediate', 'end_of_cycle'].includes(timing)) {
        setError('Enter immediate or end_of_cycle.')
        return
      }

      const reason = window.prompt('Cancellation reason (optional):', '')

      try {
        await api.post(`/subscriptions/${id}/cancel`, {
          timing,
          reason: reason || null,
        })
        await loadData()
      } catch (err) {
        setError(err.response?.data?.detail || 'Cancellation failed.')
      }

      return
    }

    const messages = {
      pause: 'Pause this subscription?',
      resume: 'Resume this subscription?',
    }

    if (!window.confirm(messages[action])) return

    try {
      await api.post(`/subscriptions/${id}/${action}`)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.detail || `Unable to ${action} subscription.`)
    }
  }

  const changePlan = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await api.post(
        `/subscriptions/${showChangePlan}/change-plan`,
        {
          new_plan_id: Number(newPlanId),
          effective,
        }
      )

      setShowChangePlan(null)
      setNewPlanId('')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to change plan.')
    }
  }

  const statusStyle = (status) => {
    const styles = {
      active: 'bg-green-50 text-green-700',
      trial: 'bg-blue-50 text-blue-700',
      past_due: 'bg-amber-50 text-amber-700',
      cancelled: 'bg-red-50 text-red-700',
    }

    return styles[status] || 'bg-slate-100 text-slate-600'
  }

  const getCustomer = (id) =>
    customers.find((customer) => customer.id === id)

  const getPlan = (id) =>
    [...plans, ...[]].find((plan) => plan.id === id)

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer subscriptions and their lifecycle.
          </p>
        </div>

        <button
          onClick={() => { setError(''); setShowForm(true) }}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus size={18} /> Create Subscription
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {typeof error === 'string' ? error : JSON.stringify(error)}
          <button onClick={() => setError('')}><X size={18} /></button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['active', 'trial', 'past_due', 'cancelled'].map((status) => (
          <div key={status} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm capitalize text-slate-500">
              {status.replace('_', ' ')}
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {subscriptions.filter((s) => s.status === status).length}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900">All Subscriptions</h2>
          <button onClick={loadData} className="rounded-lg p-2 hover:bg-slate-100">
            <RefreshCw size={18} />
          </button>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading subscriptions...</p>
        ) : subscriptions.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            No subscriptions found. Create your first subscription.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Subscription</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Plan</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Period Ends</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub) => {
                  const customer = getCustomer(sub.customer_id)
                  const plan = getPlan(sub.plan_id)

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        #{sub.id}
                      </td>
                      <td className="px-5 py-4">
                        {customer?.name || `Customer #${sub.customer_id}`}
                      </td>
                      <td className="px-5 py-4">
                        {plan?.name || `Plan #${sub.plan_id}`}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(sub.status)}`}>
                          {sub.status}
                        </span>
                        {sub.is_paused && (
                          <span className="ml-2 text-xs text-amber-600">Paused</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {sub.current_period_end
                          ? new Date(sub.current_period_end).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {sub.status !== 'cancelled' && (
                            <>
                              {sub.is_paused ? (
                                <button
                                  title="Resume"
                                  onClick={() => performAction(sub.id, 'resume')}
                                  className="rounded-lg border border-green-200 p-2 text-green-700 hover:bg-green-50"
                                >
                                  <Play size={15} />
                                </button>
                              ) : (
                                <button
                                  title="Pause"
                                  onClick={() => performAction(sub.id, 'pause')}
                                  className="rounded-lg border border-amber-200 p-2 text-amber-700 hover:bg-amber-50"
                                >
                                  <Pause size={15} />
                                </button>
                              )}

                              <button
                                title="Change plan"
                                onClick={() => {
                                  setError('')
                                  setShowChangePlan(sub.id)
                                }}
                                className="rounded-lg border border-indigo-200 p-2 text-indigo-700 hover:bg-indigo-50"
                              >
                                <Repeat size={15} />
                              </button>

                              <button
                                title="Cancel"
                                onClick={() => performAction(sub.id, 'cancel')}
                                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                              >
                                <Ban size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Subscription</h2>
              <button onClick={() => setShowForm(false)}><X size={22} /></button>
            </div>

            <form onSubmit={createSubscription} className="space-y-5">
              <label className="block text-sm font-medium text-slate-700">
                Select Customer
                <select
                  required
                  value={form.customer_id}
                  onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                >
                  <option value="">Choose a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} — {customer.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Select Plan
                <select
                  required
                  value={form.plan_id}
                  onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                >
                  <option value="">Choose an active plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {plan.currency} {plan.price} / {plan.billing_interval}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.start_trial}
                  onChange={(e) => setForm({ ...form, start_trial: e.target.checked })}
                  className="h-4 w-4"
                />
                Start with trial (if supported by the selected plan)
              </label>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Create Subscription
              </button>
            </form>
          </div>
        </div>
      )}

      {showChangePlan !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Change Subscription Plan</h2>
              <button onClick={() => setShowChangePlan(null)}><X size={22} /></button>
            </div>

            <form onSubmit={changePlan} className="space-y-5">
              <label className="block text-sm font-medium text-slate-700">
                New Plan
                <select
                  required
                  value={newPlanId}
                  onChange={(e) => setNewPlanId(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                >
                  <option value="">Choose a plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {plan.currency} {plan.price}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                When should the change take effect?
                <select
                  value={effective}
                  onChange={(e) => setEffective(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                >
                  <option value="immediate">Immediately</option>
                  <option value="next_cycle">Next billing cycle</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={!newPlanId}
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white disabled:opacity-50"
              >
                Confirm Plan Change
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}