'use client'
import { useState, useEffect } from 'react'
import { Heart, Download, Bookmark, Trash2, X, UserPlus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

export default function MediaGrid({ media, onMediaDeleted, eventRole }) {
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [likes, setLikes] = useState({})
  const [favourites, setFavourites] = useState({})
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [showTagSearch, setShowTagSearch] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [tagResults, setTagResults] = useState([])

  // Load initial like/favourite state when media changes
  useEffect(() => {
    if (!media.length) return
    const initialLikes = {}
    const initialFavs = {}
    media.forEach(item => {
      initialLikes[item.id] = item.user_liked || false
      initialFavs[item.id] = item.user_favourited || false
    })
    setLikes(initialLikes)
    setFavourites(initialFavs)
  }, [media])

  const openMedia = async (item) => {
    setSelected(item)
    setLoadingComments(true)
    try {
      const res = await api.get(`/social/comments/${item.id}`)
      setComments(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleLike = async (mediaId) => {
    try {
      const res = await api.post('/social/like', { media_id: mediaId })
      setLikes(prev => ({ ...prev, [mediaId]: res.data.liked }))
    } catch (err) {
      console.error(err)
    }
  }

  const handleFavourite = async (mediaId) => {
    try {
      const res = await api.post('/social/favourite', { media_id: mediaId })
      setFavourites(prev => ({ ...prev, [mediaId]: res.data.favourited }))
    } catch (err) {
      console.error(err)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      const res = await api.post('/social/comment', { media_id: selected.id, text: commentText })
      setComments(prev => [...prev, { ...res.data, name: user.name }])
      setCommentText('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleDownload = async (mediaId) => {
    try {
      const res = await api.get(`/media/download/${mediaId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `media-${mediaId}.jpg`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (mediaId) => {
    if (!confirm('Delete this media?')) return
    try {
      await api.delete(`/media/${mediaId}`)
      setSelected(null)
      onMediaDeleted?.()
    } catch (err) {
      console.error(err)
    }
  }

  const searchUsersForTag = async (q) => {
    if (!q.trim()) return setTagResults([])
    try {
      const res = await api.get(`/social/search-users?q=${q}`)
      setTagResults(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleTagUser = async (taggedUserId) => {
    try {
      await api.post('/social/tag', { media_id: selected.id, tagged_user_id: taggedUserId })
      setShowTagSearch(false)
      setTagSearch('')
      setTagResults([])
      alert('User tagged!')
    } catch (err) {
      console.error(err)
    }
  }

  if (media.length === 0) {
    return (
      <div className="border border-dashed border-[#2a2a2a] rounded-xl p-16 text-center">
        <p className="text-gray-600 text-sm">No media here yet</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {media.map(item => (
          <div
            key={item.id}
            className="aspect-square bg-[#141414] rounded-lg overflow-hidden cursor-pointer relative group"
            onClick={() => openMedia(item)}
          >
            {item.media_type === 'video' ? (
              <video src={item.url} className="w-full h-full object-cover" />
            ) : (
              <img src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex flex-col items-start justify-end p-2">
              <div className="opacity-0 group-hover:opacity-100 transition">
                {item.tags?.slice(0, 2).map(tag => (
                  <span key={tag} className="text-xs bg-black/50 text-white px-1.5 py-0.5 rounded mr-1">
                    {tag}
                  </span>
                ))}
                <span className="flex items-center gap-1 text-white text-xs mt-1">
                  <Heart size={11} /> {String(item.like_count || 0)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div className="fixed inset-0 bg-black/90 z-50 flex">
          <div className="flex-1 flex items-center justify-center p-8 relative">
            <button
              onClick={() => { setSelected(null); setComments([]) }}
              className="absolute top-4 left-4 text-gray-400 hover:text-white transition"
            >
              <X size={22} />
            </button>
            {selected.media_type === 'video' ? (
              <video src={selected.url} controls className="max-h-full max-w-full rounded-lg" />
            ) : (
              <img src={selected.url} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
            )}
          </div>

          <div className="w-80 bg-[#0f0f0f] border-l border-[#1e1e1e] flex flex-col">
            {/* Info */}
            <div className="p-4 border-b border-[#1e1e1e]">
              <p className="text-sm text-white font-medium">{selected.uploader_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(selected.created_at).toLocaleDateString()}
              </p>
                {selected.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selected.tags.map(tag => (
                      <span key={tag} className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 border-b border-[#1e1e1e] flex items-center gap-2 relative">
              <button
                onClick={() => handleLike(selected.id)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition ${
                  likes[selected.id]
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                }`}
              >
                <Heart size={14} fill={likes[selected.id] ? 'currentColor' : 'none'} />
                {String(selected.like_count || 0)}
              </button>

              <button
                onClick={() => handleFavourite(selected.id)}
                className={`p-1.5 rounded-lg transition ${
                  favourites[selected.id] ? 'text-yellow-400' : 'text-gray-500 hover:text-white'
                }`}
              >
                <Bookmark size={16} fill={favourites[selected.id] ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={() => setShowTagSearch(!showTagSearch)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white transition"
              >
                <UserPlus size={16} />
              </button>

              {showTagSearch && (
                <div className="absolute top-12 left-0 w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-2 z-10">
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={e => { setTagSearch(e.target.value); searchUsersForTag(e.target.value) }}
                    placeholder="Search users to tag..."
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-white focus:outline-none mb-2"
                  />
                  {tagResults.map(u => (
                    <div
                      key={u.id}
                      onClick={() => handleTagUser(u.id)}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#2a2a2a] rounded cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-xs text-white">{u.name[0].toUpperCase()}</span>
                      </div>
                      <span className="text-xs text-white">{u.name}</span>
                      <span className="text-xs text-gray-500 ml-auto">{u.role}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleDownload(selected.id)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white transition"
              >
                <Download size={16} />
              </button>

              {(user?.id === selected.uploaded_by || eventRole === 'admin' || selected.user_role === 'admin') && (
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 transition ml-auto"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingComments ? (
                <p className="text-gray-600 text-xs">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-gray-600 text-xs">No comments yet</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-600/50 flex items-center justify-center shrink-0">
                      <span className="text-xs text-white">{c.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-300">
                        <span className="text-white font-medium">{c.name} </span>
                        {c.text}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            <form onSubmit={handleComment} className="p-4 border-t border-[#1e1e1e] flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-[#141414] border border-[#1e1e1e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs transition"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
