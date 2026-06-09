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
    <div className="app-page">
      <Navbar />
      <main className="app-main">
        <div className="page-header">
          <div>
            <div className="flex items-center gap-3">
              <BarChart2 size={24} className="text-[#F59E0B]" />
              <h1 className="page-title">Analytics</h1>
              {selectedClub && <span className="premium-chip">{selectedClub.name}</span>}
            </div>
            <p className="page-subtitle">Track event activity, media performance, and recent uploads.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#171717] border border-[#2A2622] rounded-md h-28 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Stats grid */}
            <div className="analytics-stats-grid">
              {[
                { label: 'Total Events', value: stats.total_events, icon: Calendar },
                { label: 'Total Media', value: stats.total_media, icon: Image },
                { label: 'Total Likes', value: stats.total_likes, icon: Heart },
                { label: 'Total Comments', value: stats.total_comments, icon: MessageCircle },
                { label: 'Total Members', value: stats.total_members, icon: Users },
                { label: 'Total Clubs', value: stats.total_clubs, icon: BarChart2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="stat-card">
                  <div className="stat-label">
                    <Icon size={15} className="text-[#7C7A74]" />
                    <span>{label}</span>
                  </div>
                  <p className="stat-value">{value || 0}</p>
                </div>
              ))}
            </div>

            {/* Top events */}
            {stats.top_events?.length > 0 && (
              <div className="mb-10">
                <h2 className="section-title mb-4">Top Events by Media</h2>
                <div className="bg-[#171717] border border-[#2A2622] rounded-md overflow-hidden">
                  {stats.top_events.map((event, i) => (
                    <div key={event.id} className={`flex items-center justify-between gap-4 px-5 py-4 ${i !== stats.top_events.length - 1 ? 'border-b border-[#2A2622]' : ''}`}>
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs text-[#F59E0B] w-5 font-semibold">#{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm text-[#F0EDE8]">{event.title}</p>
                          <p className="text-xs text-[#7C7A74]">{event.club_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 shrink-0">
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
              <div className="mb-10">
                <h2 className="section-title mb-4">Most Liked Photos</h2>
                <div className="media-grid">
                  {stats.most_liked.map(media => (
                    <div key={media.id} className="relative group">
                      <div className="aspect-square bg-[#171717] rounded-[3px] overflow-hidden">
                        <img src={media.thumbnail_url || media.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-[#111111]/80 border border-[#2A2622] rounded px-2 py-1 flex items-center gap-1.5">
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
                <h2 className="section-title mb-4">Recent Uploads</h2>
                <div className="bg-[#171717] border border-[#2A2622] rounded-md overflow-hidden">
                  {stats.recent_uploads.map((media, i) => (
                    <div key={media.id} className={`flex items-center gap-4 px-5 py-4 ${i !== stats.recent_uploads.length - 1 ? 'border-b border-[#2A2622]' : ''}`}>
                      <div className="w-12 h-12 rounded-[3px] overflow-hidden shrink-0">
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
