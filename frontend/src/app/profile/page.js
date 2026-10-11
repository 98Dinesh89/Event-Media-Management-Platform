'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import MediaGrid from '@/components/MediaGrid'
import { useRouter } from 'next/navigation'
import { useClub } from '@/context/ClubContext'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [favourites, setFavourites] = useState([])
  const { selectedClub, currentRole } = useClub()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading])

  useEffect(() => {
    fetchFavourites()
  }, [])

  const fetchFavourites = async () => {
    try {
      const res = await api.get('/social/favourites')
      setFavourites(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="app-page">
      <Navbar />
      <main className="app-main">

        {/* Profile header */}
        <div className="premium-form-card profile-card mb-10">
          <div className="profile-header-content">
          <div className="w-20 h-20 rounded-full bg-[#F59E0B] flex items-center justify-center shrink-0">
            <span className="text-3xl text-[#111111] font-semibold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 pt-1">
            <h1 className="text-xl font-semibold text-[#F0EDE8]">{user?.name || ''}</h1>
            <p className="text-[#7C7A74] text-sm mt-1">{user?.email || ''}</p>
            {selectedClub && currentRole && (
              <span className="inline-block mt-3 text-xs bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 px-2.5 py-1 rounded">
                {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
              </span>
            )}
          </div>

          </div>
        </div>

          <div>
            {favourites.length === 0 ? (
              <div className="empty-state">
                <p className="text-[#B5B1AA] text-sm">No favourites yet</p>
                <p className="text-[#7C7A74] text-xs mt-1">Bookmark photos to see them here</p>
              </div>
            ) : (
              <MediaGrid media={favourites} />
            )}
          </div>
      </main>
    </div>
  )
}
