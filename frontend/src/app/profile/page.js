'use client'
import { useEffect, useState, useRef } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { User, Upload, Camera, Loader } from 'lucide-react'
import MediaGrid from '@/components/MediaGrid'
import { useRouter } from 'next/navigation'
import { useClub } from '@/context/ClubContext'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [faceMatches, setFaceMatches] = useState([])
  const [favourites, setFavourites] = useState([])
  const [selfieUrl, setSelfieUrl] = useState(null)
  const [uploadingSelfie, setUploadingSelfie] = useState(false)
  const [findingPhotos, setFindingPhotos] = useState(false)
  const [activeTab, setActiveTab] = useState('face')
  const fileRef = useRef()
  const { selectedClub, currentRole } = useClub()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading])

  useEffect(() => {
    fetchFaceMatches()
    fetchFavourites()
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me')
      setSelfieUrl(res.data.selfie_url)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchFaceMatches = async () => {
    try {
      const res = await api.get('/ai/my-photos')
      setFaceMatches(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchFavourites = async () => {
    try {
      const res = await api.get('/social/favourites')
      setFavourites(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingSelfie(true)
    try {
      const formData = new FormData()
      formData.append('selfie', file)
      const res = await api.post('/ai/selfie', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSelfieUrl(res.data.selfie_url)
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingSelfie(false)
    }
  }

  const handleFindMe = async () => {
    if (!selfieUrl) return alert('Please upload a selfie first')
    setFindingPhotos(true)
    try {
      const res = await api.post('/ai/find-me')
      setFaceMatches(res.data)
      setActiveTab('face')
    } catch (err) {
      console.error(err)
    } finally {
      setFindingPhotos(false)
    }
  }

  const tabs = [
  { id: 'face', label: 'My photos', count: String(faceMatches.length) },
  { id: 'favourites', label: 'Favourites', count: String(favourites.length) },
  ]

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

          {/* Selfie section */}
          <div className="profile-selfie-panel">
            <div className="group relative profile-selfie">
              {selfieUrl ? (
                <img src={selfieUrl} alt="selfie" className="w-full h-full object-cover" />
              ) : (
                <Camera size={22} className="text-[#7C7A74]" />
              )}
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Camera size={16} className="text-[#F0EDE8]" />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSelfieUpload} />
            <div className="grid gap-2">
            <button
              onClick={() => fileRef.current.click()}
              disabled={uploadingSelfie}
              className="premium-button premium-button-secondary"
            >
              {uploadingSelfie ? <Loader size={11} className="animate-spin" /> : <Upload size={11} />}
              {selfieUrl ? 'Update selfie' : 'Upload selfie'}
            </button>
            <button
              onClick={handleFindMe}
              disabled={findingPhotos || !selfieUrl}
              className="premium-button premium-button-primary disabled:opacity-50"
            >
              {findingPhotos ? <Loader size={11} className="animate-spin" /> : <User size={11} />}
              {findingPhotos ? 'Searching...' : 'Find my photos'}
            </button>
            </div>
          </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
              <span className="text-xs bg-[#1A1A1A] border border-[#2A2622] px-1.5 py-0.5 rounded">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'face' && (
          <div>
            {faceMatches.length === 0 ? (
              <div className="empty-state">
                <svg className="mx-auto mb-4 h-20 w-20 text-[#2A2622]" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                  <rect x="12" y="18" width="56" height="44" rx="4" stroke="currentColor" strokeWidth="2" />
                  <circle cx="40" cy="38" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M24 58c4-9 11-14 16-14s12 5 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="text-[#B5B1AA] text-sm mb-1">No photos found yet</p>
                <p className="text-[#7C7A74] text-xs">Upload a selfie and click "Find my photos"</p>
              </div>
            ) : (
              <MediaGrid media={faceMatches} />
            )}
          </div>
        )}

        {activeTab === 'favourites' && (
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
        )}
      </main>
    </div>
  )
}
