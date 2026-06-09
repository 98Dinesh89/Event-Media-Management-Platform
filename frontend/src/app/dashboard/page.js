'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'
import { Calendar, Image, Plus, ArrowRight, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useClub } from '@/context/ClubContext'

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [events, setEvents] = useState([])
  const [recentMedia, setRecentMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [mediaCount, setMediaCount] = useState(0)
  const { selectedClub, currentRole } = useClub()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading])
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams()
        if (selectedClub) params.append('club_id', selectedClub.id)
        const eventsRes = await api.get(`/events?${params}`)
        setEvents(eventsRes.data.slice(0, 6))

        // Count media uploaded by this user
        const mediaRes = await api.get(`/media/my-count${selectedClub ? `?club_id=${selectedClub.id}` : ''}`)
        setMediaCount(mediaRes.data.count)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedClub])

  const roleSummary = selectedClub
    ? (currentRole ? currentRole.charAt(0).toUpperCase() + currentRole.slice(1) : 'Viewer')
    : (user?.clubs?.length ? `${user.clubs.length} Club${user.clubs.length > 1 ? 's' : ''}` : 'Viewer')

  const canCreateEvent = user?.clubs?.some(club => ['admin', 'photographer'].includes(club.role)) ?? false

  return (
    <div className="app-page">
      <Navbar />
      <main className="app-main">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              Good to see you, {user?.name?.split(' ')[0]}
            </h1>
            <p className="page-subtitle">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
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

        {/* Stats row */}
        <div className="stats-grid">
          {[
            { label: 'Total Events', value: String(events.length), icon: Calendar },
            { label: selectedClub ? 'Your Role' : 'Clubs Joined', value: roleSummary, icon: Tag },
            { label: 'Media Uploaded', value: String(mediaCount), icon: Image },
            ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="stat-card">
              <div className="stat-label">
                <Icon size={14} className="text-[#7C7A74]" />
                <span>{label}</span>
              </div>
              <p className="stat-value">{value}</p>
            </div>
          ))}
        </div>

        {/* Events section */}
        <div className="section-header">
          <h2 className="section-title">Recent Events</h2>
          <Link href="/events" className="section-link">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#171717] border border-[#2A2622] rounded-md h-48 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="border border-dashed border-[#2A2622] rounded-md p-16 text-center bg-[#171717]">
            <Calendar size={28} className="text-[#7C7A74] mx-auto mb-3" />
            <p className="text-[#B5B1AA] text-sm">No events yet</p>
            {canCreateEvent && (
              <Link href="/events/create" className="text-[#F59E0B] text-sm hover:text-[#D97706] mt-2 inline-block">
                Create your first event
              </Link>
            )}
          </div>
        ) : (
          <div className="premium-grid">
            {events.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="event-card group">
                  <div className="event-cover">
                    {event.cover_image ? (
                      <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300" />
                    ) : (
                      <div className="event-placeholder">
                        <Calendar size={32} />
                      </div>
                    )}
                  </div>
                  <div className="event-body">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="event-title group-hover:text-[#F59E0B] transition">{event.title}</h3>
                      <span className={`premium-chip ${event.is_public ? 'border-[#2A2622] text-[#B5B1AA]' : ''}`}>
                        {event.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <p className="event-description">{event.description || 'No description'}</p>
                    <div className="event-meta-row">
                      <span>
                      {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'No date'}
                      </span>
                      <span>{event.media_count || 0} photos</span>
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
