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
    <div className="min-h-screen bg-[#111111] text-[#F0EDE8]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-semibold text-[#F0EDE8]">
              Good to see you, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-[#7C7A74] text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {canCreateEvent && (
            <Link
              href="/events/create"
              className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#111111] text-sm font-semibold px-4 py-2 rounded-md transition"
            >
              <Plus size={15} />
              New Event
            </Link>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total Events', value: String(events.length), icon: Calendar },
            { label: selectedClub ? 'Your Role' : 'Clubs Joined', value: roleSummary, icon: Tag },
            { label: 'Media Uploaded', value: String(mediaCount), icon: Image },
            ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[#171717] border border-[#2A2622] border-l-[#F59E0B] border-l-2 rounded-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon size={14} className="text-[#7C7A74]" />
                <span className="text-xs text-[#7C7A74]">{label}</span>
              </div>
              <p className="text-2xl font-semibold text-[#F0EDE8]">{value}</p>
            </div>
          ))}
        </div>

        {/* Events section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F0EDE8]">Recent Events</h2>
          <Link href="/events" className="text-sm text-[#F59E0B] hover:text-[#D97706] flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#171717] border border-[#2A2622] rounded-md h-48 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="border border-dashed border-[#2A2622] rounded-md p-12 text-center bg-[#171717]">
            <Calendar size={28} className="text-[#7C7A74] mx-auto mb-3" />
            <p className="text-[#B5B1AA] text-sm">No events yet</p>
            {canCreateEvent && (
              <Link href="/events/create" className="text-[#F59E0B] text-sm hover:text-[#D97706] mt-2 inline-block">
                Create your first event
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="bg-[#171717] border border-[#2A2622] hover:border-[#F59E0B] rounded-md overflow-hidden transition cursor-pointer group">
                  <div className="h-36 bg-[#1A1A1A] relative overflow-hidden">
                    {event.cover_image ? (
                      <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300" />
                    ) : (
                      <div className="w-full h-full bg-[linear-gradient(135deg,#1A1A1A,#2A2622)] flex items-center justify-center">
                        <Calendar size={24} className="text-[#7C7A74]" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-[#F0EDE8] text-sm font-medium group-hover:text-[#F59E0B] transition line-clamp-1">{event.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded border ${event.is_public ? 'border-[#2A2622] text-[#B5B1AA]' : 'border-[#F59E0B]/30 text-[#F59E0B]'}`}>
                        {event.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <p className="text-[#7C7A74] text-xs line-clamp-2 mb-3">{event.description || 'No description'}</p>
                    <div className="flex items-center justify-between text-xs text-[#7C7A74]">
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
