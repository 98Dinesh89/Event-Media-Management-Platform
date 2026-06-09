'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Plus, Calendar, Filter, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useClub } from '@/context/ClubContext'

export default function EventsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('created_at')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const { selectedClub } = useClub()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading])

  const categories = ['Photography', 'Workshop', 'Trip', 'Competition', 'Cultural', 'Party', 'Other']

  useEffect(() => {
    fetchEvents()
  }, [sort, category, selectedClub])


  const fetchEvents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (sort) params.append('sort', sort)
      if (category) params.append('category', category)
      if (selectedClub) params.append('club_id', selectedClub.id)
      const res = await api.get(`/events?${params}`)
      setEvents(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase())
  )
  const canCreateEvent = user?.clubs?.some(club => ['admin', 'photographer'].includes(club.role)) ?? false

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-white">Events</h1>
          {canCreateEvent && (
            <Link
              href="/events/create"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              <Plus size={15} />
              New Event
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#141414] border border-[#1e1e1e] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-[#141414] border border-[#1e1e1e] rounded-lg px-3 py-2 text-sm text-gray-400 focus:outline-none focus:border-purple-500"
          >
            <option value="created_at">Latest</option>
            <option value="date">Event Date</option>
            <option value="name">Name A-Z</option>
          </select>

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-[#141414] border border-[#1e1e1e] rounded-lg px-3 py-2 text-sm text-gray-400 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#141414] border border-[#1e1e1e] rounded-xl h-44 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-[#2a2a2a] rounded-xl p-16 text-center">
            <Calendar size={28} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="bg-[#141414] border border-[#1e1e1e] hover:border-[#2e2e2e] rounded-xl overflow-hidden transition group cursor-pointer">
                  {/* Cover image or placeholder */}
                  <div className="h-32 bg-[#1a1a1a] relative">
                    {event.cover_image ? (
                      <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar size={24} className="text-gray-700" />
                      </div>
                    )}
                    <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-md ${event.is_public ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {event.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-white text-sm font-medium group-hover:text-purple-300 transition line-clamp-1">{event.title}</h3>
                    </div>
                    <p className="text-gray-500 text-xs line-clamp-2 mb-3">{event.description || 'No description'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-[#1e1e1e] text-gray-500 px-2 py-0.5 rounded">{event.category || 'General'}</span>
                      <span className="text-xs text-gray-600">{event.media_count || 0} files</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{event.club_name || 'Club'} - {event.user_role}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
