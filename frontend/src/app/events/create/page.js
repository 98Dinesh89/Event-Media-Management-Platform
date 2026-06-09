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
    <div className="app-page">
      <Navbar />
      <main className="app-main">
        <Link href="/events" className="flex items-center gap-2 text-[#7C7A74] hover:text-[#F0EDE8] text-sm mb-8 transition">
          <ArrowLeft size={15} />
          Back to events
        </Link>

        <h1 className="page-title form-page-title">Create new event</h1>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 p-3 rounded-md">{error}</p>}

        <form onSubmit={handleSubmit} className="premium-form-card form-stack">
          <div>
            <label className="field-label">Club</label>
            <select
              value={form.club_id}
              onChange={e => setForm({...form, club_id: e.target.value})}
              className="premium-select"
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
            <label className="field-label">Event title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="premium-input"
              placeholder="e.g. Annual Photography Contest 2024"
              required
            />
          </div>

          <div>
            <label className="field-label">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              rows={4}
              className="premium-textarea"
              placeholder="Describe the event..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                className="premium-select"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="field-label">Event date</label>
              <input
                type="date"
                value={form.event_date}
                onChange={e => setForm({...form, event_date: e.target.value})}
                className="premium-input"
              />
            </div>
          </div>

          <div>
            <label className="field-label">Visibility</label>
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
              className="premium-button premium-button-secondary flex-1"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="premium-button premium-button-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create event'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
