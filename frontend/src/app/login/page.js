'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.user)
      router.push('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111111] text-[#F0EDE8] px-4">
      <div className="bg-[#171717] p-6 sm:p-8 rounded-md w-full max-w-md border border-[#2A2622]">
        <h1 className="text-2xl font-semibold text-[#F0EDE8] mb-2">Welcome back</h1>
        <p className="text-[#B5B1AA] text-sm mb-6">Sign in to your account</p>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 p-3 rounded-md">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#111111] py-3 rounded-md font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-[#B5B1AA] text-sm mt-6 text-center">
          Don't have an account?{' '}
          <Link href="/register" className="text-[#F59E0B] hover:text-[#D97706]">Register</Link>
        </p>
      </div>
    </div>
  )
}
