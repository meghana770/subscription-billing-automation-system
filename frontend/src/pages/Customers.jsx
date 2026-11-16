import { useEffect, useState } from 'react'
import { Search, Plus, Users, Mail, MapPin, X } from 'lucide-react'
import api from '../api'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', country: 'IN' })

  const loadCustomers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/customers')
      setCustomers(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load customers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const createCustomer = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/customers', form)
      setForm({ name: '', email: '', country: 'IN' })
      setShowForm(false)
      await loadCustomers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create customer.')
    }
  }

  const filtered = customers.filter((customer) =>
    `${customer.name} ${customer.email} ${customer.country}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your customer database.
          </p>
        </div>

        <button
          onClick={() => { setError(''); setShowForm(true) }}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Customers</p>
            <Users className="text-indigo-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {customers.length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading customers...</p>
        ) : error ? (
          <p className="p-8 text-center text-red-600">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Country</th>
                  <th className="px-6 py-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="flex items-center gap-2">
                        <Mail size={15} /> {customer.email}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="flex items-center gap-2">
                        <MapPin size={15} /> {customer.country}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {customer.created_at
                        ? new Date(customer.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add Customer</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={createCustomer} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Full Name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-indigo-500"
                  placeholder="Enter customer name"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Email Address
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-indigo-500"
                  placeholder="customer@example.com"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Country Code
                <input
                  required
                  maxLength={2}
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-indigo-500"
                  placeholder="IN"
                />
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}