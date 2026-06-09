'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Plus, Calendar, Search } from 'lucide-react'
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
    <div className="app-page">
      <Navbar />
      <main className="app-main">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Events</h1>
            <p className="page-subtitle">Browse albums, filter by category, and open event media.</p>
          </div>
          {canCreateEvent && (
            <Link
              href="/events/create"
              className="premium-button premium-button-primary"
            >
              <Plus size={15} />
              New Event
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="filter-row">
          <div className="search-control">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="premium-input"
            />
          </div>

          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="premium-select"
          >
            <option value="created_at">Latest</option>
            <option value="date">Event Date</option>
            <option value="name">Name A-Z</option>
          </select>

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="premium-select"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#171717] border border-[#2A2622] rounded-md h-60 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-[#2A2622] rounded-md p-16 sm:p-20 text-center bg-[#171717]">
            <Calendar size={28} className="text-[#7C7A74] mx-auto mb-3" />
            <p className="text-[#B5B1AA] text-sm">No events found</p>
          </div>
        ) : (
          <div className="premium-grid">
            {filtered.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="event-card group">
                  {/* Cover image or placeholder */}
                  <div className="event-cover">
                    {event.cover_image ? (
                      <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300" />
                    ) : (
                      <div className="event-placeholder">
                        <Calendar size={32} />
                      </div>
                    )}
                    <span className={`event-badge ${event.is_public ? '' : 'border-[#F59E0B]/40 text-[#F59E0B]'}`}>
                      {event.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>

                  <div className="event-body">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="event-title group-hover:text-[#F59E0B] transition">{event.title}</h3>
                    </div>
                    <p className="event-description">{event.description || 'No description'}</p>
                    <div className="event-card-footer">
                      <div className="event-taxonomy">
                        <span className="premium-chip border-[#2A2622] text-[#B5B1AA]">{event.category || 'General'}</span>
                        <span className="event-club-meta">{event.club_name || 'Club'} - {event.user_role}</span>
                      </div>
                      <span className="text-xs text-[#7C7A74]">{event.media_count || 0} files</span>
                    </div>
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
