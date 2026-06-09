'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { ArrowLeft, Users, Plus } from 'lucide-react'
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
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="max-w-lg mx-auto px-6 py-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition">
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>

        <h1 className="text-lg font-semibold text-white mb-6">Join or create a club</h1>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 p-3 rounded-lg">{error}</p>}

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition border ${mode === 'join' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-[#141414] border-[#1e1e1e] text-gray-400 hover:text-white'}`}
          >
            Join existing club
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition border ${mode === 'create' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-[#141414] border-[#1e1e1e] text-gray-400 hover:text-white'}`}
          >
            Create new club
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'join' ? (
            <>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Select club</label>
                {clubs.length === 0 ? (
                  <p className="text-gray-500 text-sm bg-[#141414] border border-[#1e1e1e] rounded-lg p-4">
                    No clubs available to join
                  </p>
                ) : (
                  <select
                    value={selectedClubId}
                    onChange={e => setSelectedClubId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#1e1e1e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
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
                <label className="text-sm text-gray-400 mb-1.5 block">Your role</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="w-full bg-[#141414] border border-[#1e1e1e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
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
                <label className="text-sm text-gray-400 mb-1.5 block">Club name</label>
                <input
                  type="text"
                  value={clubName}
                  onChange={e => setClubName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#1e1e1e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Photography Club"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Description</label>
                <textarea
                  value={clubDescription}
                  onChange={e => setClubDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#141414] border border-[#1e1e1e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="What is this club about?"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'join' && clubs.length === 0)}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition mt-2"
          >
            {loading ? 'Processing...' : mode === 'join' ? 'Join club' : 'Create club'}
          </button>
        </form>
      </main>
    </div>
  )
}