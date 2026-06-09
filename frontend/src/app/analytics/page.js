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
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-8">
          <BarChart2 size={20} className="text-purple-400" />
          <h1 className="text-lg font-semibold text-white">Analytics</h1>
          {selectedClub && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded ml-2">
              {selectedClub.name}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#141414] border border-[#1e1e1e] rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Events', value: stats.total_events, icon: Calendar, color: 'text-blue-400' },
                { label: 'Total Media', value: stats.total_media, icon: Image, color: 'text-green-400' },
                { label: 'Total Likes', value: stats.total_likes, icon: Heart, color: 'text-red-400' },
                { label: 'Total Comments', value: stats.total_comments, icon: MessageCircle, color: 'text-yellow-400' },
                { label: 'Total Members', value: stats.total_members, icon: Users, color: 'text-purple-400' },
                { label: 'Total Clubs', value: stats.total_clubs, icon: BarChart2, color: 'text-pink-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={15} className={color} />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                  <p className="text-3xl font-semibold text-white">{value || 0}</p>
                </div>
              ))}
            </div>

            {/* Top events */}
            {stats.top_events?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Top Events by Media</h2>
                <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl overflow-hidden">
                  {stats.top_events.map((event, i) => (
                    <div key={event.id} className={`flex items-center justify-between px-5 py-3 ${i !== stats.top_events.length - 1 ? 'border-b border-[#1e1e1e]' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                        <div>
                          <p className="text-sm text-white">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.club_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Image size={11} /> {event.media_count}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${event.is_public ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
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
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Most Liked Photos</h2>
                <div className="grid grid-cols-5 gap-3">
                  {stats.most_liked.map(media => (
                    <div key={media.id} className="relative group">
                      <div className="aspect-square bg-[#141414] rounded-lg overflow-hidden">
                        <img src={media.thumbnail_url || media.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1.5 py-0.5 flex items-center gap-1">
                        <Heart size={10} className="text-red-400" />
                        <span className="text-xs text-white">{media.like_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent activity */}
            {stats.recent_uploads?.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Recent Uploads</h2>
                <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl overflow-hidden">
                  {stats.recent_uploads.map((media, i) => (
                    <div key={media.id} className={`flex items-center gap-4 px-5 py-3 ${i !== stats.recent_uploads.length - 1 ? 'border-b border-[#1e1e1e]' : ''}`}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                        <img src={media.thumbnail_url || media.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{media.event_title}</p>
                        <p className="text-xs text-gray-500">by {media.uploader_name}</p>
                      </div>
                      <span className="text-xs text-gray-600">{new Date(media.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-sm">No data available</p>
        )}
      </main>
    </div>
  )
}