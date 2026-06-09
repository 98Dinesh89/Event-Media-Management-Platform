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
    <div className="min-h-screen bg-[#111111] text-[#F0EDE8]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-7">
          <h1 className="text-xl font-semibold text-[#F0EDE8]">Events</h1>
          {canCreateEvent && (
            <Link
              href="/events/create"
              className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#111111] text-sm font-semibold px-5 py-3 rounded-md transition"
            >
              <Plus size={15} />
              New Event
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-8">
          <div className="relative flex-1 max-w-full md:max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C7A74]" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#171717] border border-[#2A2622] rounded-md pl-10 pr-4 py-3 text-sm text-[#F0EDE8] placeholder-[#7C7A74] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-[#171717] border border-[#2A2622] rounded-md px-4 py-3 text-sm text-[#B5B1AA] focus:outline-none focus:border-[#F59E0B]"
          >
            <option value="created_at">Latest</option>
            <option value="date">Event Date</option>
            <option value="name">Name A-Z</option>
          </select>

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-[#171717] border border-[#2A2622] rounded-md px-4 py-3 text-sm text-[#B5B1AA] focus:outline-none focus:border-[#F59E0B]"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="bg-[#171717] border border-[#2A2622] hover:border-[#F59E0B] rounded-md overflow-hidden transition group cursor-pointer">
                  {/* Cover image or placeholder */}
                  <div className="h-48 bg-[#1A1A1A] relative overflow-hidden">
                    {event.cover_image ? (
                      <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300" />
                    ) : (
                      <div className="w-full h-full bg-[linear-gradient(135deg,#1A1A1A,#2A2622)] flex items-center justify-center">
                        <Calendar size={24} className="text-[#7C7A74]" />
                      </div>
                    )}
                    <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded border bg-[#111111]/80 ${event.is_public ? 'border-[#2A2622] text-[#B5B1AA]' : 'border-[#F59E0B]/40 text-[#F59E0B]'}`}>
                      {event.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-[#F0EDE8] text-base font-medium group-hover:text-[#F59E0B] transition line-clamp-1">{event.title}</h3>
                    </div>
                    <p className="text-[#7C7A74] text-sm line-clamp-2 mb-4 leading-relaxed">{event.description || 'No description'}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs bg-[#1A1A1A] border border-[#2A2622] text-[#B5B1AA] px-2.5 py-1 rounded">{event.category || 'General'}</span>
                      <span className="text-xs text-[#7C7A74]">{event.media_count || 0} files</span>
                    </div>
                    <p className="text-xs text-[#7C7A74] mt-3">{event.club_name || 'Club'} - {event.user_role}</p>
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
