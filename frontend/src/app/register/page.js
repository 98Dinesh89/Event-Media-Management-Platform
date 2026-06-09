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
    <div className="min-h-screen flex items-center justify-center bg-[#111111] text-[#F0EDE8] px-4 py-8">
      <div className="bg-[#171717] p-6 sm:p-8 rounded-md w-full max-w-md border border-[#2A2622]">
        <h1 className="text-2xl font-semibold text-[#F0EDE8] mb-2">Create account</h1>
        <p className="text-[#B5B1AA] text-sm mb-6">Join the platform</p>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 p-3 rounded-md">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#7C7A74] mb-1.5 block">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-3 text-[#F0EDE8] placeholder-[#7C7A74] focus:outline-none focus:border-[#F59E0B]"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="text-xs text-[#7C7A74] mb-1.5 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-3 text-[#F0EDE8] placeholder-[#7C7A74] focus:outline-none focus:border-[#F59E0B]"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-xs text-[#7C7A74] mb-1.5 block">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-3 text-[#F0EDE8] placeholder-[#7C7A74] focus:outline-none focus:border-[#F59E0B]"
              placeholder="Password"
              required
            />
          </div>
          <div>
            <label className="text-xs text-[#7C7A74] mb-2 block">Club setup</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'join', label: 'Join clubs' },
                { value: 'create', label: 'Create club' }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, mode: opt.value })}
                  className={`py-2 rounded-md border text-sm transition ${
                    form.mode === opt.value
                      ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F0EDE8]'
                      : 'border-[#2A2622] bg-[#111111] text-[#B5B1AA] hover:text-[#F0EDE8]'
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
                <label className="text-xs text-[#7C7A74] mb-1.5 block">Club name</label>
                <input
                  type="text"
                  value={form.club_name}
                  onChange={e => setForm({ ...form, club_name: e.target.value })}
                  className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-3 text-[#F0EDE8] placeholder-[#7C7A74] focus:outline-none focus:border-[#F59E0B]"
                  placeholder="Photography Club"
                  required={form.mode === 'create'}
                />
              </div>
              <div>
                <label className="text-xs text-[#7C7A74] mb-1.5 block">Club description</label>
                <textarea
                  value={form.club_description}
                  onChange={e => setForm({ ...form, club_description: e.target.value })}
                  className="w-full bg-[#111111] border border-[#2A2622] rounded-md px-4 py-3 text-[#F0EDE8] placeholder-[#7C7A74] focus:outline-none focus:border-[#F59E0B] resize-none"
                  placeholder="What is this club about?"
                  rows={3}
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <label className="text-xs text-[#7C7A74] block">Join up to 3 clubs</label>
              {form.clubs.map((club, index) => (
                <div key={index} className="grid grid-cols-[1fr_130px] gap-2">
                  <select
                    value={club.club_id}
                    onChange={e => {
                      const clubs = [...form.clubs]
                      clubs[index] = { ...clubs[index], club_id: e.target.value }
                      setForm({ ...form, clubs })
                    }}
                    className="bg-[#111111] border border-[#2A2622] rounded-md px-3 py-2.5 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#F59E0B]"
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
                    className="bg-[#111111] border border-[#2A2622] rounded-md px-3 py-2.5 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#F59E0B]"
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
                  className="text-sm text-[#F59E0B] hover:text-[#D97706]"
                >
                  Add another club
                </button>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#111111] py-3 rounded-md font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-[#B5B1AA] text-sm mt-6 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-[#F59E0B] hover:text-[#D97706]">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
