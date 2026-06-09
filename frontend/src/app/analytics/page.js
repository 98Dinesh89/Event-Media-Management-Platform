'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useClub } from '@/context/ClubContext'
import { useRouter } from 'next/navigation'
import { BarChart2, Image, Heart, MessageCircle, Users, Calendar } from 'lucide-react'

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const { selectedClub } = useClub()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = selectedClub ? `?club_id=${selectedClub.id}` : ''
        const res = await api.get(`/analytics${params}`)
        setStats(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [selectedClub])

  return (
    <div className="min-h-screen bg-[#111111] text-[#F0EDE8]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-2 mb-8">
          <BarChart2 size={18} className="text-[#F59E0B]" />
          <h1 className="text-lg font-semibold text-[#F0EDE8]">Analytics</h1>
          {selectedClub && (
            <span className="text-xs bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 px-2 py-0.5 rounded ml-2">
              {selectedClub.name}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#171717] border border-[#2A2622] rounded-md h-28 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {[
                { label: 'Total Events', value: stats.total_events, icon: Calendar },
                { label: 'Total Media', value: stats.total_media, icon: Image },
                { label: 'Total Likes', value: stats.total_likes, icon: Heart },
                { label: 'Total Comments', value: stats.total_comments, icon: MessageCircle },
                { label: 'Total Members', value: stats.total_members, icon: Users },
                { label: 'Total Clubs', value: stats.total_clubs, icon: BarChart2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-[#171717] border border-[#2A2622] border-l-[#F59E0B] border-l-2 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={14} className="text-[#7C7A74]" />
                    <span className="text-xs text-[#7C7A74]">{label}</span>
                  </div>
                  <p className="text-3xl font-semibold text-[#F0EDE8]">{value || 0}</p>
                </div>
              ))}
            </div>

            {/* Top events */}
            {stats.top_events?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-[#F0EDE8] mb-3">Top Events by Media</h2>
                <div className="bg-[#171717] border border-[#2A2622] rounded-md overflow-hidden">
                  {stats.top_events.map((event, i) => (
                    <div key={event.id} className={`flex items-center justify-between px-4 py-3 ${i !== stats.top_events.length - 1 ? 'border-b border-[#2A2622]' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#F59E0B] w-5 font-semibold">#{i + 1}</span>
                        <div>
                          <p className="text-sm text-[#F0EDE8]">{event.title}</p>
                          <p className="text-xs text-[#7C7A74]">{event.club_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-xs text-[#7C7A74]">
                          <Image size={11} /> {event.media_count}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded border ${event.is_public ? 'border-[#2A2622] text-[#B5B1AA]' : 'border-[#F59E0B]/40 text-[#F59E0B]'}`}>
                          {event.is_public ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most liked media */}
            {stats.most_liked?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-[#F0EDE8] mb-3">Most Liked Photos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {stats.most_liked.map(media => (
                    <div key={media.id} className="relative group">
                      <div className="aspect-square bg-[#171717] rounded-[3px] overflow-hidden">
                        <img src={media.thumbnail_url || media.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute bottom-1 right-1 bg-[#111111]/80 border border-[#2A2622] rounded px-1.5 py-0.5 flex items-center gap-1">
                        <Heart size={10} className="text-[#F59E0B]" />
                        <span className="text-xs text-[#F0EDE8]">{media.like_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent activity */}
            {stats.recent_uploads?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#F0EDE8] mb-3">Recent Uploads</h2>
                <div className="bg-[#171717] border border-[#2A2622] rounded-md overflow-hidden">
                  {stats.recent_uploads.map((media, i) => (
                    <div key={media.id} className={`flex items-center gap-4 px-4 py-3 ${i !== stats.recent_uploads.length - 1 ? 'border-b border-[#2A2622]' : ''}`}>
                      <div className="w-10 h-10 rounded-[3px] overflow-hidden shrink-0">
                        <img src={media.thumbnail_url || media.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F0EDE8] truncate">{media.event_title}</p>
                        <p className="text-xs text-[#7C7A74]">by {media.uploader_name}</p>
                      </div>
                      <span className="text-xs text-[#7C7A74]">{new Date(media.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-[#7C7A74] text-sm">No data available</p>
        )}
      </main>
    </div>
  )
}
