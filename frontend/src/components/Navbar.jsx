'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import { useClub } from '@/context/ClubContext'
import { useEffect, useState, useRef } from 'react'
import { Bell, Search, LogOut, Camera, Home, Calendar, ChevronDown, Plus, Users } from 'lucide-react'
import api from '@/lib/api'
import { BarChart2 } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { socket } = useSocket()
  const { selectedClub, selectClub, currentRole } = useClub()
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [showClubMenu, setShowClubMenu] = useState(false)
  const [unread, setUnread] = useState(0)
  const clubMenuRef = useRef(null)

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
      socket.on('notification', () => {
        setUnread(prev => prev + 1)
        api.get('/social/notifications').then(res => setNotifications(res.data))
      })
    }
  }, [socket])

  // Close club menu when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (clubMenuRef.current && !clubMenuRef.current.contains(e.target)) {
        setShowClubMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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

  const clubs = user?.clubs || []
  const displayClubName = selectedClub ? selectedClub.name : 'All Clubs'
  const displayRole = selectedClub ? currentRole : null

  return (
    <nav className="h-14 border-b border-[#1e1e1e] bg-[#0f0f0f] flex items-center px-6 gap-4 sticky top-0 z-50">
      <Link href="/dashboard" className="text-white font-semibold text-sm tracking-tight flex items-center gap-2 mr-2">
        <Camera size={18} className="text-purple-400" />
        MediaVault
      </Link>

      {/* Club switcher */}
      {user && (
        <div className="relative" ref={clubMenuRef}>
          <button
            onClick={() => setShowClubMenu(!showClubMenu)}
            className="flex items-center gap-1.5 bg-[#141414] border border-[#2a2a2a] hover:border-[#3a3a3a] text-sm px-3 py-1.5 rounded-lg transition"
          >
            <Users size={13} className="text-purple-400" />
            <span className="text-gray-300">{displayClubName}</span>
            {displayRole && (
              <span className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                {displayRole}
              </span>
            )}
            <ChevronDown size={13} className="text-gray-500" />
          </button>

          {showClubMenu && (
            <div className="absolute left-0 top-10 w-56 bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-xl z-50 overflow-hidden">
              {/* All clubs option */}
              <button
                onClick={() => { selectClub(null); setShowClubMenu(false) }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition hover:bg-[#1e1e1e] ${!selectedClub ? 'text-purple-400' : 'text-gray-300'}`}
              >
                <Users size={14} />
                All Clubs
                {!selectedClub && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />}
              </button>

              {clubs.length > 0 && <div className="border-t border-[#2a2a2a]" />}

              {/* Individual clubs */}
              {clubs.map(club => (
                <button
                  key={club.id}
                  onClick={() => { selectClub(club); setShowClubMenu(false) }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition hover:bg-[#1e1e1e] ${selectedClub?.id === club.id ? 'text-purple-400' : 'text-gray-300'}`}
                >
                  <div className="w-5 h-5 rounded bg-purple-600/30 flex items-center justify-center shrink-0">
                    <span className="text-xs text-purple-300">{club.name[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{club.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{club.role}</p>
                  </div>
                  {selectedClub?.id === club.id && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />}
                </button>
              ))}

              <div className="border-t border-[#2a2a2a]" />

              {/* Join/Create club */}
              <Link
                href="/clubs/join"
                onClick={() => setShowClubMenu(false)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-[#1e1e1e] transition"
              >
                <Plus size={14} />
                Join or create club
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Nav links */}
      <div className="flex items-center gap-1">
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
        <Link href="/analytics" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-[#1a1a1a] transition">
            <BarChart2 size={15} />
            Analytics
        </Link>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
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
                      <p className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
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