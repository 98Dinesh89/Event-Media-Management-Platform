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
    <div className="min-h-screen bg-[#111111] text-[#F0EDE8]">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-[#7C7A74] hover:text-[#F0EDE8] text-sm mb-6 transition">
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>

        <h1 className="text-lg font-semibold text-[#F0EDE8] mb-6">Join or create a club</h1>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 p-3 rounded-md">{error}</p>}

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition border ${mode === 'join' ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-[#F0EDE8]' : 'bg-[#171717] border-[#2A2622] text-[#B5B1AA] hover:text-[#F0EDE8]'}`}
          >
            Join existing club
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition border ${mode === 'create' ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-[#F0EDE8]' : 'bg-[#171717] border-[#2A2622] text-[#B5B1AA] hover:text-[#F0EDE8]'}`}
          >
            Create new club
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-[#171717] border border-[#2A2622] rounded-md p-5">
          {mode === 'join' ? (
            <>
              <div>
                <label className="text-xs text-[#7C7A74] mb-1.5 block">Select club</label>
                {clubs.length === 0 ? (
                  <p className="text-[#7C7A74] text-sm bg-[#111111] border border-[#2A2622] rounded-md p-4">
                    No clubs available to join
                  </p>
                ) : (
                  <select
                    value={selectedClubId}
                    onChange={e => setSelectedClubId(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-2.5 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#F59E0B]"
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
                <label className="text-xs text-[#7C7A74] mb-1.5 block">Your role</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-2.5 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#F59E0B]"
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
                <label className="text-xs text-[#7C7A74] mb-1.5 block">Club name</label>
                <input
                  type="text"
                  value={clubName}
                  onChange={e => setClubName(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-2.5 text-sm text-[#F0EDE8] placeholder-[#7C7A74] focus:outline-none focus:border-[#F59E0B]"
                  placeholder="e.g. Photography Club"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[#7C7A74] mb-1.5 block">Description</label>
                <textarea
                  value={clubDescription}
                  onChange={e => setClubDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-2.5 text-sm text-[#F0EDE8] placeholder-[#7C7A74] focus:outline-none focus:border-[#F59E0B] resize-none"
                  placeholder="What is this club about?"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'join' && clubs.length === 0)}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-[#111111] py-2.5 rounded-md text-sm font-semibold transition mt-2"
          >
            {loading ? 'Processing...' : mode === 'join' ? 'Join club' : 'Create club'}
          </button>
        </form>
      </main>
    </div>
  )
}
