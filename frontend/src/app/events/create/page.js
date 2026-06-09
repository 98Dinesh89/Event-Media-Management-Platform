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
    <div className="min-h-screen bg-[#111111] text-[#F0EDE8]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <Link href="/events" className="flex items-center gap-2 text-[#7C7A74] hover:text-[#F0EDE8] text-sm mb-8 transition">
          <ArrowLeft size={15} />
          Back to events
        </Link>

        <h1 className="text-xl font-semibold text-[#F0EDE8] mb-7">Create new event</h1>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 p-3 rounded-md">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5 bg-[#171717] border border-[#2A2622] rounded-md p-6">
          <div>
            <label className="text-xs text-[#7C7A74] mb-1.5 block">Club</label>
            <select
              value={form.club_id}
              onChange={e => setForm({...form, club_id: e.target.value})}
              className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-2.5 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#F59E0B]"
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
            <label className="text-xs text-[#7C7A74] mb-1.5 block">Event title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-2.5 text-sm text-[#F0EDE8] placeholder-[#7C7A74] focus:outline-none focus:border-[#F59E0B]"
              placeholder="e.g. Annual Photography Contest 2024"
              required
            />
          </div>

          <div>
            <label className="text-xs text-[#7C7A74] mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              rows={4}
              className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-2.5 text-sm text-[#F0EDE8] placeholder-[#7C7A74] focus:outline-none focus:border-[#F59E0B] resize-none"
              placeholder="Describe the event..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#7C7A74] mb-1.5 block">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-2.5 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#F59E0B]"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#7C7A74] mb-1.5 block">Event date</label>
              <input
                type="date"
                value={form.event_date}
                onChange={e => setForm({...form, event_date: e.target.value})}
                className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-2.5 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#7C7A74] mb-1.5 block">Visibility</label>
            <div className="flex gap-3">
              {[
                { value: true, label: 'Public', desc: 'Anyone can view' },
                { value: false, label: 'Private', desc: 'Members only' }
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setForm({...form, is_public: opt.value})}
                  className={`flex-1 p-4 rounded-md border text-left transition ${
                    form.is_public === opt.value
                      ? 'border-[#F59E0B] bg-[#F59E0B]/10'
                      : 'border-[#2A2622] bg-[#111111] hover:border-[#F59E0B]/60'
                  }`}
                >
                  <p className="text-sm text-[#F0EDE8] font-medium">{opt.label}</p>
                  <p className="text-xs text-[#7C7A74] mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <Link
              href="/events"
              className="flex-1 text-center py-2.5 rounded-md border border-[#2A2622] text-sm text-[#B5B1AA] hover:text-[#F0EDE8] hover:border-[#F59E0B]/60 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-[#111111] py-2.5 rounded-md text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create event'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
