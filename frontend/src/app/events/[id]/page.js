'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Upload, Lock, Globe, Calendar, ArrowLeft, X, Image as ImageIcon, Share2 } from 'lucide-react'
import Link from 'next/link'
import MediaGrid from '@/components/MediaGrid'
import { QRCodeSVG } from 'qrcode.react'
import { useInView } from 'react-intersection-observer'

export default function EventPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [showQR, setShowQR] = useState(false)
  const [event, setEvent] = useState(null)
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { ref, inView } = useInView({ threshold: 0 })

  useEffect(() => {
    if (inView && hasMore && !loading) {
      const next = page + 1
      setPage(next)
      fetchMedia(next)
    }
  }, [inView])

  useEffect(() => {
    fetchEvent()
    fetchMedia()
  }, [id])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading])
  

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`)
      setEvent(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMedia = async (pageNum = 1) => {
    try {
      const res = await api.get(`/media/event/${id}?page=${pageNum}&limit=20`)
      if (pageNum === 1) {
        setMedia(res.data)
      } else {
        setMedia(prev => [...prev, ...res.data])
      }
      setHasMore(res.data.length === 20)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchMedia(next)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    setSelectedFiles(files)
  }

  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files))
  }

  const handleUpload = async () => {
    if (!selectedFiles.length) return
    setUploading(true)
    try {
      const formData = new FormData()
      selectedFiles.forEach(f => formData.append('files', f))
      formData.append('event_id', id)
      formData.append('is_public', event.is_public)
      await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSelectedFiles([])
      setShowUpload(false)
      fetchMedia(1)
      setPage(1)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const canUpload = ['admin', 'photographer'].includes(user?.role)

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Back */}
        <Link href="/events" className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition">
          <ArrowLeft size={15} />
          All events
        </Link>

        {event && (
          <>
            {/* Event header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-[#1e1e1e] text-gray-500 px-2 py-0.5 rounded">{event.category}</span>
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${event.is_public ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {event.is_public ? <Globe size={11} /> : <Lock size={11} />}
                    {event.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
                <h1 className="text-xl font-semibold text-white mb-1">{event.title}</h1>
                <p className="text-gray-500 text-sm max-w-xl">{event.description}</p>
                {event.event_date && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-600 mt-2">
                    <Calendar size={12} />
                    {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canUpload && (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition"
                  >
                    <Upload size={15} />
                    Upload media
                  </button>
                )}
                <button
                  onClick={() => setShowQR(true)}
                  className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-gray-300 text-sm px-4 py-2 rounded-lg transition"
                >
                  <Share2 size={15} />
                  Share
                </button>
              </div>
            </div>

            {/* Upload modal */}
            {showUpload && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-lg p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-white font-medium">Upload media</h2>
                    <button onClick={() => { setShowUpload(false); setSelectedFiles([]) }} className="text-gray-500 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition ${dragOver ? 'border-purple-500 bg-purple-500/5' : 'border-[#2a2a2a]'}`}
                  >
                    <ImageIcon size={28} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm mb-1">Drag and drop files here</p>
                    <p className="text-gray-600 text-xs mb-4">JPG, PNG, WEBP, MP4 supported</p>
                    <label className="cursor-pointer bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 text-sm px-4 py-2 rounded-lg transition">
                      Browse files
                      <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                    </label>
                  </div>

                  {/* Selected files preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">{selectedFiles.length} file(s) selected</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedFiles.slice(0, 6).map((f, i) => (
                          <div key={i} className="bg-[#1e1e1e] rounded-lg px-3 py-1.5 text-xs text-gray-400 flex items-center gap-1.5">
                            <ImageIcon size={11} />
                            {f.name.length > 20 ? f.name.slice(0, 20) + '...' : f.name}
                          </div>
                        ))}
                        {selectedFiles.length > 6 && (
                          <div className="bg-[#1e1e1e] rounded-lg px-3 py-1.5 text-xs text-gray-500">
                            +{selectedFiles.length - 6} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => { setShowUpload(false); setSelectedFiles([]) }}
                      className="flex-1 py-2.5 rounded-lg border border-[#2a2a2a] text-sm text-gray-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={!selectedFiles.length || uploading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition"
                    >
                      {uploading ? 'Uploading...' : `Upload ${selectedFiles.length || ''} file(s)`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* QR Modal — place here */}
            {showQR && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 flex flex-col items-center gap-4 w-72">
                  <div className="flex items-center justify-between w-full">
                    <h2 className="text-white font-medium text-sm">Share event</h2>
                    <button onClick={() => setShowQR(false)} className="text-gray-500 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <QRCodeSVG
                      value={typeof window !== 'undefined' ? window.location.href : ''}
                      size={180}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                  <p className="text-gray-500 text-xs text-center">Scan to open this event album</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      alert('Link copied!')
                    }}
                    className="w-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 text-sm py-2 rounded-lg transition"
                  >
                    Copy link
                  </button>
                </div>
              </div>
            )}

            {/* Media grid */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{media.length} files</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-square bg-[#141414] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <MediaGrid media={media} onMediaDeleted={() => fetchMedia(1)} />
            )}

            {hasMore && media.length > 0 && (
              <div ref={ref} className="h-10 flex items-center justify-center mt-4">
                {loading && <p className="text-gray-600 text-xs">Loading more...</p>}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}