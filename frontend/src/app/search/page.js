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
    <div className="app-page">
      <Navbar />
      <main className="app-main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Search media</h1>
            <p className="page-subtitle">Find event photos by caption, tag, uploader, or date range.</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="premium-form-card mb-10" style={{ width: '100%', maxWidth: 'none' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#7C7A74] mb-1.5 block">Event name or caption</label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Annual fest"
                className="premium-input"
              />
            </div>
            <div>
              <label className="text-xs text-[#7C7A74] mb-1.5 block">Tag</label>
              <input
                type="text"
                value={tag}
                onChange={e => setTag(e.target.value)}
                placeholder="e.g. mountains, crowd"
                className="premium-input"
              />
            </div>
            <div>
              <label className="text-xs text-[#7C7A74] mb-1.5 block">Uploader name</label>
              <input
                type="text"
                value={uploader}
                onChange={e => setUploader(e.target.value)}
                placeholder="e.g. Dinesh"
                className="premium-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#7C7A74] mb-1.5 block">From date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="premium-input"
                />
              </div>
              <div>
                <label className="text-xs text-[#7C7A74] mb-1.5 block">To date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="premium-input"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="premium-button premium-button-primary"
            >
              <Search size={14} />
              Search
            </button>
            {searched && (
              <button
                type="button"
                onClick={clearAll}
                className="premium-button premium-button-secondary"
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
              <div key={i} className="skeleton-square" />
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
