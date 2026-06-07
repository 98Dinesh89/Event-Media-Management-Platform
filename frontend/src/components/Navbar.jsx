'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import { useEffect, useState } from 'react'
import { Bell, Search, LogOut, User, Camera, Home, Calendar } from 'lucide-react'
import api from '@/lib/api'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { socket } = useSocket()
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (user) {
      api.get('/social/notifications').then(res => {
        setNotifications(res.data)
        setUnread(res.data.filter(n => !n.is_read).length)
      })
    }
  }, [user])

  useEffect(() => {
    if (socket) {
      socket.on('notification', (data) => {
        setUnread(prev => prev + 1)
        api.get('/social/notifications').then(res => setNotifications(res.data))
      })
    }
  }, [socket])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const toggleNotifs = async () => {
    setShowNotifs(!showNotifs)
    if (!showNotifs && unread > 0) {
      await api.put('/social/notifications/read')
      setUnread(0)
    }
  }

  return (
    <nav className="h-14 border-b border-[#1e1e1e] bg-[#0f0f0f] flex items-center px-6 gap-6 sticky top-0 z-50">
      <Link href="/dashboard" className="text-white font-semibold text-sm tracking-tight flex items-center gap-2">
        <Camera size={18} className="text-purple-400" />
        MediaVault
      </Link>

      <div className="flex items-center gap-1 ml-2">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-[#1a1a1a] transition">
          <Home size={15} />
          Home
        </Link>
        <Link href="/events" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-[#1a1a1a] transition">
          <Calendar size={15} />
          Events
        </Link>
        <Link href="/search" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-[#1a1a1a] transition">
          <Search size={15} />
          Search
        </Link>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={toggleNotifs}
            className="relative p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-md transition"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-10 w-80 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2a2a]">
                <p className="text-sm font-medium text-white">Notifications</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-[#2a2a2a] hover:bg-[#222] transition ${!n.is_read ? 'bg-purple-500/5' : ''}`}>
                      <p className="text-sm text-gray-300">
                        <span className="text-white font-medium">{n.from_name}</span> {n.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toRelativeTimeString?.() || new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#1a1a1a] transition">
          <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-xs text-white font-medium">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <span className="text-sm text-gray-300">{user?.name}</span>
        </Link>

        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-md transition"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  )
}