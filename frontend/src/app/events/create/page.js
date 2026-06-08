'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateEventPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    club_id: '',
    title: '',
    description: '',
    category: 'Photography',
    event_date: '',
    is_public: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clubs, setClubs] = useState([])

  const categories = ['Photography', 'Workshop', 'Trip', 'Competition', 'Cultural', 'Party', 'Other']

  useEffect(() => {
    api.get('/clubs/mine')
      .then(res => {
        const manageable = res.data.filter(club => ['admin', 'photographer'].includes(club.role))
        setClubs(manageable)
        if (manageable.length > 0) {
          setForm(prev => ({ ...prev, club_id: manageable[0].id }))
        }
      })
      .catch(err => console.error(err))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/events', form)
      router.push(`/events/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/events" className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition">
          <ArrowLeft size={15} />
          Back to events
        </Link>

        <h1 className="text-lg font-semibold text-white mb-6">Create new event</h1>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 p-3 rounded-lg">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Club</label>
            <select
              value={form.club_id}
              onChange={e => setForm({...form, club_id: e.target.value})}
              className="w-full bg-[#141414] border border-[#1e1e1e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              required
            >
              {clubs.length === 0 ? (
                <option value="">No clubs available</option>
              ) : (
                clubs.map(club => <option key={club.id} value={club.id}>{club.name} - {club.role}</option>)
              )}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Event title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-[#141414] border border-[#1e1e1e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              placeholder="e.g. Annual Photography Contest 2024"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              rows={4}
              className="w-full bg-[#141414] border border-[#1e1e1e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Describe the event..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                className="w-full bg-[#141414] border border-[#1e1e1e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Event date</label>
              <input
                type="date"
                value={form.event_date}
                onChange={e => setForm({...form, event_date: e.target.value})}
                className="w-full bg-[#141414] border border-[#1e1e1e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Visibility</label>
            <div className="flex gap-3">
              {[
                { value: true, label: 'Public', desc: 'Anyone can view' },
                { value: false, label: 'Private', desc: 'Members only' }
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setForm({...form, is_public: opt.value})}
                  className={`flex-1 p-3 rounded-lg border text-left transition ${
                    form.is_public === opt.value
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-[#1e1e1e] bg-[#141414] hover:border-[#2e2e2e]'
                  }`}
                >
                  <p className="text-sm text-white font-medium">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/events"
              className="flex-1 text-center py-2.5 rounded-lg border border-[#1e1e1e] text-sm text-gray-400 hover:text-white hover:border-[#2e2e2e] transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create event'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
