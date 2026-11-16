import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Archive, X, Package, RefreshCw } from 'lucide-react'
import api from '../api'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  currency: 'INR',
  billing_interval: 'monthly',
  trial_period_days: 0,
  features: {},
}

export default function Plans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadPlans = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/plans', {
        params: { include_archived: true },
      })
      setPlans(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load plans.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const openCreate = () => {
    setEditingPlan(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (plan) => {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      description: plan.description || '',
      price: String(plan.price),
      trial_period_days: plan.trial_period_days,
      features: plan.features || {},
    })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = editingPlan
      ? {
          name: form.name,
          description: form.description || null,
          price: Number(form.price),
          trial_period_days: Number(form.trial_period_days),
          features: form.features,
        }
      : {
          ...form,
          price: Number(form.price),
          trial_period_days: Number(form.trial_period_days),
        }

    try {
      if (editingPlan) {
        await api.patch(`/plans/${editingPlan.id}`, payload)
      } else {
        await api.post('/plans', payload)
      }
      setShowForm(false)
      await loadPlans()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to save plan.')
    } finally {
      setSaving(false)
    }
  }

  const archivePlan = async (plan) => {
    if (!window.confirm(`Archive "${plan.name}"?`)) return

    setError('')
    try {
      await api.post(`/plans/${plan.id}/archive`)
      await loadPlans()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to archive plan.')
    }
  }

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Plans</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage your subscription pricing plans.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus size={18} /> Create Plan
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 sm:max-w-sm">
        <Search size={18} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search plans..."
          className="w-full text-sm outline-none"
        />
        <button onClick={loadPlans} title="Refresh plans">
          <RefreshCw size={17} className="text-slate-400" />
        </button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-slate-500">Loading plans...</p>
      ) : filteredPlans.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center">
          <Package className="mx-auto mb-3 text-slate-300" size={38} />
          <h3 className="font-semibold text-slate-700">No plans found</h3>
          <p className="mt-1 text-sm text-slate-400">
            Create your first subscription plan to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredPlans.map((plan) => (
            <div key={plan.id} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                  <Package size={22} />
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  plan.status === 'active'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {plan.status}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">{plan.name}</h3>
              <p className="mt-1 min-h-10 text-sm text-slate-500">
                {plan.description || 'No description provided.'}
              </p>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-3xl font-bold text-slate-900">
                  {plan.currency} {Number(plan.price).toLocaleString('en-IN')}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  per {plan.billing_interval === 'annual' ? 'year' : 'month'}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Trial period: {plan.trial_period_days} days
                </p>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => openEdit(plan)}
                  disabled={plan.status !== 'active'}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Pencil size={15} /> Edit
                </button>
                {plan.status === 'active' && (
                  <button
                    onClick={() => archivePlan(plan)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Archive size={15} /> Archive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                {editingPlan ? 'Edit Plan' : 'Create Plan'}
              </h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <FormField label="Plan name">
                <input required maxLength={100} value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="form-input" />
              </FormField>

              <FormField label="Description">
                <textarea value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="form-input" rows="2" />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Price (INR)">
                  <input required type="number" min="0" step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="form-input" />
                </FormField>

                <FormField label="Billing interval">
                  <select value={form.billing_interval}
                    disabled={!!editingPlan}
                    onChange={(e) => setForm({ ...form, billing_interval: e.target.value })}
                    className="form-input disabled:bg-slate-100">
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Trial period (days)">
                <input type="number" min="0" max="365"
                  value={form.trial_period_days}
                  onChange={(e) => setForm({ ...form, trial_period_days: e.target.value })}
                  className="form-input" />
              </FormField>

              <button disabled={saving}
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {saving ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}