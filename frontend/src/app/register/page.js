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
    <div className="auth-page">
      <div className="premium-form-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join the platform</p>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 p-3 rounded-md">{error}</p>}

        <form onSubmit={handleSubmit} className="form-stack">
          <div>
            <label className="field-label">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="premium-input"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="premium-input"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="premium-input"
              placeholder="Password"
              required
            />
          </div>
          <div>
            <label className="field-label">Club setup</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'join', label: 'Join clubs' },
                { value: 'create', label: 'Create club' }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, mode: opt.value })}
                  className={`premium-button ${
                    form.mode === opt.value
                      ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F0EDE8]'
                      : 'premium-button-secondary'
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
                <label className="field-label">Club name</label>
                <input
                  type="text"
                  value={form.club_name}
                  onChange={e => setForm({ ...form, club_name: e.target.value })}
                  className="premium-input"
                  placeholder="Photography Club"
                  required={form.mode === 'create'}
                />
              </div>
              <div>
                <label className="field-label">Club description</label>
                <textarea
                  value={form.club_description}
                  onChange={e => setForm({ ...form, club_description: e.target.value })}
                  className="premium-textarea"
                  placeholder="What is this club about?"
                  rows={3}
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <label className="field-label">Join up to 3 clubs</label>
              {form.clubs.map((club, index) => (
                <div key={index} className="grid grid-cols-[1fr_130px] gap-2">
                  <select
                    value={club.club_id}
                    onChange={e => {
                      const clubs = [...form.clubs]
                      clubs[index] = { ...clubs[index], club_id: e.target.value }
                      setForm({ ...form, clubs })
                    }}
                    className="premium-select"
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
                    className="premium-select"
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
            className="premium-button premium-button-primary w-full disabled:opacity-50"
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
