'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function JoinClubPage() {
  const router = useRouter()
  const { user, login } = useAuth()
  const [mode, setMode] = useState('join')
  const [clubs, setClubs] = useState([])
  const [selectedClubId, setSelectedClubId] = useState('')
  const [selectedRole, setSelectedRole] = useState('viewer')
  const [clubName, setClubName] = useState('')
  const [clubDescription, setClubDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/clubs').then(res => {
      const myClubIds = user?.clubs?.map(c => c.id) || []
      setClubs(res.data.filter(c => !myClubIds.includes(c.id)))
    })
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'join') {
        await api.post('/clubs/join', {
          club_id: selectedClubId,
          role: selectedRole
        })
      } else {
        await api.post('/clubs/create', {
          name: clubName,
          description: clubDescription
        })
      }
      // Refresh user data
      const meRes = await api.get('/auth/me')
      const token = localStorage.getItem('token')
      login(token, meRes.data)
      router.push('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-page">
      <Navbar />
      <main className="app-main">
        <Link href="/dashboard" className="flex items-center gap-2 text-[#7C7A74] hover:text-[#F0EDE8] text-sm mb-8 transition">
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>

        <h1 className="page-title form-page-title">Join or create a club</h1>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 p-3 rounded-md">{error}</p>}

        {/* Mode toggle */}
        <div className="flex gap-3 mb-7">
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-3 rounded-md text-sm font-medium transition border ${mode === 'join' ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-[#F0EDE8]' : 'bg-[#171717] border-[#2A2622] text-[#B5B1AA] hover:text-[#F0EDE8]'}`}
          >
            Join existing club
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 rounded-md text-sm font-medium transition border ${mode === 'create' ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-[#F0EDE8]' : 'bg-[#171717] border-[#2A2622] text-[#B5B1AA] hover:text-[#F0EDE8]'}`}
          >
            Create new club
          </button>
        </div>

        <form onSubmit={handleSubmit} className="premium-form-card form-stack">
          {mode === 'join' ? (
            <>
              <div>
                <label className="field-label">Select club</label>
                {clubs.length === 0 ? (
                  <p className="text-[#7C7A74] text-sm bg-[#111111] border border-[#2A2622] rounded-md p-4">
                    No clubs available to join
                  </p>
                ) : (
                  <select
                    value={selectedClubId}
                    onChange={e => setSelectedClubId(e.target.value)}
                    className="premium-select"
                    required
                  >
                    <option value="">Choose a club...</option>
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.member_count} members)
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="field-label">Your role</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="premium-select"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Club Member</option>
                  <option value="photographer">Photographer</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="field-label">Club name</label>
                <input
                  type="text"
                  value={clubName}
                  onChange={e => setClubName(e.target.value)}
                  className="premium-input"
                  placeholder="e.g. Photography Club"
                  required
                />
              </div>
              <div>
                <label className="field-label">Description</label>
                <textarea
                  value={clubDescription}
                  onChange={e => setClubDescription(e.target.value)}
                  rows={3}
                  className="premium-textarea"
                  placeholder="What is this club about?"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'join' && clubs.length === 0)}
            className="premium-button premium-button-primary w-full disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : mode === 'join' ? 'Join club' : 'Create club'}
          </button>
        </form>
      </main>
    </div>
  )
}
