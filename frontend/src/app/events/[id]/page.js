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

  const canUpload = event?.user_role === 'admin' || (event?.user_role === 'photographer' && event?.created_by === user?.id)

  return (
    <div className="app-page">
      <Navbar />
      <main className="app-main-wide">

        {/* Back */}
        <Link href="/events" className="flex items-center gap-2 text-[#7C7A74] hover:text-[#F0EDE8] text-sm mb-8 transition">
          <ArrowLeft size={15} />
          All events
        </Link>

        {event && (
          <>
            {/* Event header */}
            <div className="event-detail-header">
              <div className="event-detail-meta">
                <div className="event-detail-badges">
                  <span className="premium-chip border-[#2A2622] text-[#B5B1AA]">{event.category}</span>
                  <span className={`premium-chip ${event.is_public ? 'border-[#2A2622] text-[#B5B1AA]' : ''}`}>
                    {event.is_public ? <Globe size={11} /> : <Lock size={11} />}
                    {event.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
                <h1 className="event-detail-title">{event.title}</h1>
                {event.club_name && (
                  <p className="text-[#7C7A74] text-sm">{event.club_name} - {event.user_role}</p>
                )}
                {event.description && (
                  <p className="text-[#B5B1AA] text-sm max-w-2xl leading-relaxed">{event.description}</p>
                )}
                {event.event_date && (
                  <p className="flex items-center gap-2 text-sm text-[#7C7A74]">
                    <Calendar size={12} />
                    {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="event-detail-actions">
                {canUpload && (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="premium-button premium-button-primary"
                  >
                    <Upload size={15} />
                    Upload media
                  </button>
                )}
                <button
                  onClick={() => setShowQR(true)}
                  className="premium-button premium-button-secondary"
                >
                  <Share2 size={15} />
                  Share
                </button>
              </div>
            </div>

            {/* Upload modal */}
            {showUpload && (
              <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <div className="bg-[#171717] border border-[#2A2622] rounded-lg w-full max-w-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[#F0EDE8] font-medium">Upload media</h2>
                    <button onClick={() => { setShowUpload(false); setSelectedFiles([]) }} className="text-[#7C7A74] hover:text-[#F0EDE8] p-1.5">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`border border-dashed rounded-md p-10 text-center transition ${dragOver ? 'border-[#F59E0B] bg-[#F59E0B]/5' : 'border-[#2A2622]'}`}
                  >
                    <ImageIcon size={28} className="text-[#7C7A74] mx-auto mb-3" />
                    <p className="text-[#B5B1AA] text-sm mb-1">Drag and drop files here</p>
                    <p className="text-[#7C7A74] text-xs mb-4">JPG, PNG, WEBP, MP4 supported</p>
                    <label className="cursor-pointer bg-[#1A1A1A] hover:bg-[#2A2622] border border-[#2A2622] text-[#F0EDE8] text-sm px-5 py-2.5 rounded-md transition">
                      Browse files
                      <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                    </label>
                  </div>

                  {/* Selected files preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs text-[#7C7A74] mb-3">{selectedFiles.length} file(s) selected</p>
                      <div className="flex flex-wrap gap-2.5">
                        {selectedFiles.slice(0, 6).map((f, i) => (
                          <div key={i} className="bg-[#1A1A1A] border border-[#2A2622] rounded px-3 py-2 text-xs text-[#B5B1AA] flex items-center gap-1.5">
                            <ImageIcon size={11} />
                            {f.name.length > 20 ? f.name.slice(0, 20) + '...' : f.name}
                          </div>
                        ))}
                        {selectedFiles.length > 6 && (
                          <div className="bg-[#1A1A1A] border border-[#2A2622] rounded px-3 py-2 text-xs text-[#7C7A74]">
                            +{selectedFiles.length - 6} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => { setShowUpload(false); setSelectedFiles([]) }}
                      className="flex-1 py-2.5 rounded-md border border-[#2A2622] text-sm text-[#B5B1AA] hover:text-[#F0EDE8] transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={!selectedFiles.length || uploading}
                      className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-[#111111] py-2.5 rounded-md text-sm font-semibold transition"
                    >
                      {uploading ? 'Uploading...' : `Upload ${selectedFiles.length || ''} file(s)`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* QR Modal — place here */}
            {showQR && (
              <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <div className="bg-[#171717] border border-[#2A2622] rounded-lg p-6 flex flex-col items-center gap-5 w-80">
                  <div className="flex items-center justify-between w-full">
                    <h2 className="text-[#F0EDE8] font-medium text-sm">Share event</h2>
                    <button onClick={() => setShowQR(false)} className="text-[#7C7A74] hover:text-[#F0EDE8] p-1.5">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="bg-white p-4 rounded-md">
                    <QRCodeSVG
                      value={typeof window !== 'undefined' ? window.location.href : ''}
                      size={180}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                  <p className="text-[#7C7A74] text-xs text-center">Scan to open this event album</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      alert('Link copied!')
                    }}
                    className="w-full bg-[#1A1A1A] hover:bg-[#2A2622] text-[#B5B1AA] hover:text-[#F0EDE8] text-sm py-2.5 rounded-md transition"
                  >
                    Copy link
                  </button>
                </div>
              </div>
            )}

            {/* Media grid */}
            <div className="media-section-header">
              <div>
                <h2 className="section-title">Media</h2>
                <p className="text-sm text-[#7C7A74] mt-1">{media.length} files in this event</p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-square bg-[#171717] rounded-md animate-pulse" />
                ))}
              </div>
            ) : (
              <MediaGrid media={media} onMediaDeleted={() => fetchMedia(1)} eventRole={event?.user_role} />
            )}

            {hasMore && media.length > 0 && (
              <div ref={ref} className="h-12 flex items-center justify-center mt-6">
                {loading && <p className="text-[#7C7A74] text-xs">Loading more...</p>}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
