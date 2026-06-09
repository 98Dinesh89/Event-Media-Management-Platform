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
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-white">
              Good to see you, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
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

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Events', value: String(events.length), icon: Calendar },
            { label: selectedClub ? 'Your Role' : 'Clubs Joined', value: roleSummary, icon: Tag },
            { label: 'Media Uploaded', value: '0', icon: Image },
            ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon size={15} className="text-gray-500" />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              <p className="text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Events section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Recent Events</h2>
          <Link href="/events" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#141414] border border-[#1e1e1e] rounded-xl h-36 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="border border-dashed border-[#2a2a2a] rounded-xl p-12 text-center">
            <Calendar size={28} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No events yet</p>
            {canCreateEvent && (
              <Link href="/events/create" className="text-purple-400 text-sm hover:underline mt-2 inline-block">
                Create your first event
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {events.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="bg-[#141414] border border-[#1e1e1e] hover:border-[#2e2e2e] rounded-xl p-5 transition cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs bg-[#1e1e1e] text-gray-400 px-2 py-1 rounded-md">
                      {event.category || 'General'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-md ${event.is_public ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {event.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <h3 className="text-white text-sm font-medium mb-1 group-hover:text-purple-300 transition">{event.title}</h3>
                  <p className="text-gray-500 text-xs line-clamp-2 mb-3">{event.description || 'No description'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'No date'}
                    </span>
                    <span className="text-xs text-gray-600">{event.media_count || 0} photos</span>
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
