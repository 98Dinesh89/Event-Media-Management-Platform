'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'
import { Search, X } from 'lucide-react'
import MediaGrid from '@/components/MediaGrid'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useClub } from '@/context/ClubContext'

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
  const { selectedClub } = useClub()

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
      if (selectedClub) params.append('club_id', selectedClub.id)
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
    <div className="min-h-screen bg-[#111111] text-[#F0EDE8]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <h1 className="text-xl font-semibold text-[#F0EDE8] mb-7">Search media</h1>

        <form onSubmit={handleSearch} className="bg-[#171717] border border-[#2A2622] rounded-md p-5 sm:p-6 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs text-[#7C7A74] mb-1.5 block">Event name or caption</label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Annual fest"
                className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#7C7A74] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
            <div>
              <label className="text-xs text-[#7C7A74] mb-1.5 block">Tag</label>
              <input
                type="text"
                value={tag}
                onChange={e => setTag(e.target.value)}
                placeholder="e.g. mountains, crowd"
                className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#7C7A74] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
            <div>
              <label className="text-xs text-[#7C7A74] mb-1.5 block">Uploader name</label>
              <input
                type="text"
                value={uploader}
                onChange={e => setUploader(e.target.value)}
                placeholder="e.g. Dinesh"
                className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#7C7A74] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#7C7A74] mb-1.5 block">From date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-3 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
              <div>
                <label className="text-xs text-[#7C7A74] mb-1.5 block">To date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-3 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#111111] font-semibold text-sm px-5 py-3 rounded-md transition"
            >
              <Search size={14} />
              Search
            </button>
            {searched && (
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2622] border border-[#2A2622] text-[#B5B1AA] hover:text-[#F0EDE8] text-sm px-5 py-3 rounded-md transition"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </form>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-[#171717] rounded-md animate-pulse" />
            ))}
          </div>
        )}

        {searched && !loading && (
          <>
            <p className="text-sm text-[#7C7A74] mb-5">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
            <MediaGrid media={results} />
          </>
        )}
      </main>
    </div>
  )
}
