'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    mode: 'join',
    club_name: '',
    club_description: '',
    clubs: [{ club_id: '', role: 'viewer' }]
  })
  const [availableClubs, setAvailableClubs] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    api.get('/clubs')
      .then(res => setAvailableClubs(res.data))
      .catch(err => console.error(err))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        clubs: form.mode === 'join'
          ? form.clubs.filter(club => club.club_id)
          : []
      }
      const res = await api.post('/auth/register', payload)
      login(res.data.token, res.data.user)
      router.push('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
      <div className="bg-[#1a1a1a] p-8 rounded-2xl w-full max-w-md border border-[#2a2a2a]">
        <h1 className="text-2xl font-bold text-white mb-2">Create account</h1>
        <p className="text-gray-400 mb-6">Join the platform</p>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 p-3 rounded-lg">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Club setup</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'join', label: 'Join clubs' },
                { value: 'create', label: 'Create club' }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, mode: opt.value })}
                  className={`py-2 rounded-lg border text-sm transition ${
                    form.mode === opt.value
                      ? 'border-purple-500 bg-purple-500/10 text-white'
                      : 'border-[#3a3a3a] bg-[#2a2a2a] text-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.mode === 'create' ? (
            <>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Club name</label>
                <input
                  type="text"
                  value={form.club_name}
                  onChange={e => setForm({ ...form, club_name: e.target.value })}
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Photography Club"
                  required={form.mode === 'create'}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Club description</label>
                <textarea
                  value={form.club_description}
                  onChange={e => setForm({ ...form, club_description: e.target.value })}
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="What is this club about?"
                  rows={3}
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <label className="text-sm text-gray-400 block">Join up to 3 clubs</label>
              {form.clubs.map((club, index) => (
                <div key={index} className="grid grid-cols-[1fr_130px] gap-2">
                  <select
                    value={club.club_id}
                    onChange={e => {
                      const clubs = [...form.clubs]
                      clubs[index] = { ...clubs[index], club_id: e.target.value }
                      setForm({ ...form, clubs })
                    }}
                    className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select club</option>
                    {availableClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select
                    value={club.role}
                    onChange={e => {
                      const clubs = [...form.clubs]
                      clubs[index] = { ...clubs[index], role: e.target.value }
                      setForm({ ...form, clubs })
                    }}
                    className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="member">Member</option>
                    <option value="photographer">Photographer</option>
                  </select>
                </div>
              ))}
              {form.clubs.length < 3 && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, clubs: [...form.clubs, { club_id: '', role: 'viewer' }] })}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Add another club
                </button>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-6 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
