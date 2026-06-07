'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'
import { Search, X } from 'lucide-react'
import MediaGrid from '@/components/MediaGrid'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function SearchPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [uploader, setUploader] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading])

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (tag) params.append('tag', tag)
      if (fromDate) params.append('from_date', fromDate)
      if (toDate) params.append('to_date', toDate)
      if (uploader) params.append('uploader', uploader)
      const res = await api.get(`/ai/search?${params}`)
      setResults(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const clearAll = () => {
    setQuery('')
    setTag('')
    setFromDate('')
    setToDate('')
    setUploader('')
    setResults([])
    setSearched(false)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-lg font-semibold text-white mb-6">Search media</h1>

        <form onSubmit={handleSearch} className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 mb-8">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Event name or caption</label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Annual fest"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Tag</label>
              <input
                type="text"
                value={tag}
                onChange={e => setTag(e.target.value)}
                placeholder="e.g. mountains, crowd"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Uploader name</label>
              <input
                type="text"
                value={uploader}
                onChange={e => setUploader(e.target.value)}
                placeholder="e.g. Dinesh"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">From date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">To date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-5 py-2 rounded-lg transition"
            >
              <Search size={14} />
              Search
            </button>
            {searched && (
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-400 text-sm px-4 py-2 rounded-lg transition"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </form>

        {loading && (
          <div className="grid grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-[#141414] rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {searched && !loading && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
            <MediaGrid media={results} />
          </>
        )}
      </main>
    </div>
  )
}