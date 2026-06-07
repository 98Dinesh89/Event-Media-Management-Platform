'use client'
import { useEffect, useState, useRef } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { User, Upload, Camera, Loader } from 'lucide-react'
import MediaGrid from '@/components/MediaGrid'
import { useRouter } from 'next/navigation'

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
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Profile header */}
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-6 mb-8 flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
            <span className="text-2xl text-white font-semibold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">{user?.name || ''}</h1>
            <p className="text-gray-500 text-sm">{user?.email || ''}</p>
            <span className="inline-block mt-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
            </span>
          </div>

          {/* Selfie section */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] overflow-hidden flex items-center justify-center">
              {selfieUrl ? (
                <img src={selfieUrl} alt="selfie" className="w-full h-full object-cover" />
              ) : (
                <Camera size={20} className="text-gray-600" />
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSelfieUpload} />
            <button
              onClick={() => fileRef.current.click()}
              disabled={uploadingSelfie}
              className="text-xs bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-400 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              {uploadingSelfie ? <Loader size={11} className="animate-spin" /> : <Upload size={11} />}
              {selfieUrl ? 'Update selfie' : 'Upload selfie'}
            </button>
            <button
              onClick={handleFindMe}
              disabled={findingPhotos || !selfieUrl}
              className="text-xs bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              {findingPhotos ? <Loader size={11} className="animate-spin" /> : <User size={11} />}
              {findingPhotos ? 'Searching...' : 'Find my photos'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[#1e1e1e]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm transition flex items-center gap-2 border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-white border-purple-500'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {tab.label}
              <span className="text-xs bg-[#1e1e1e] px-1.5 py-0.5 rounded">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'face' && (
          <div>
            {faceMatches.length === 0 ? (
              <div className="border border-dashed border-[#2a2a2a] rounded-xl p-16 text-center">
                <Camera size={28} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-1">No photos found yet</p>
                <p className="text-gray-600 text-xs">Upload a selfie and click "Find my photos"</p>
              </div>
            ) : (
              <MediaGrid media={faceMatches} />
            )}
          </div>
        )}

        {activeTab === 'favourites' && (
          <div>
            {favourites.length === 0 ? (
              <div className="border border-dashed border-[#2a2a2a] rounded-xl p-16 text-center">
                <p className="text-gray-500 text-sm">No favourites yet</p>
                <p className="text-gray-600 text-xs mt-1">Bookmark photos to see them here</p>
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