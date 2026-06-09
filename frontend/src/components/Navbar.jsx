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
    <nav className="premium-navbar">
      <Link href="/dashboard" className="premium-brand">
        <Camera size={18} className="text-[#F59E0B]" />
        MediaVault
      </Link>

      {/* Club switcher */}
      {user && (
        <div className="relative" ref={clubMenuRef}>
          <button
            onClick={() => setShowClubMenu(!showClubMenu)}
            className="premium-club-button"
          >
            <Users size={15} className="text-[#F59E0B] shrink-0" />
            <span className="text-[#F0EDE8] max-w-40 sm:max-w-60 truncate font-medium">{displayClubName}</span>
            {displayRole && (
              <span className="premium-role-pill capitalize">
                {displayRole}
              </span>
            )}
            <ChevronDown size={13} className="text-[#7C7A74] shrink-0" />
          </button>

          {showClubMenu && (
            <div className="premium-menu">
              {/* All clubs option */}
              <button
                onClick={() => { selectClub(null); setShowClubMenu(false) }}
                className={`premium-menu-item ${!selectedClub ? 'text-[#F59E0B]' : ''}`}
              >
                <Users size={14} />
                All Clubs
                {!selectedClub && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />}
              </button>

              {clubs.length > 0 && <div className="border-t border-[#2A2622]" />}

              {/* Individual clubs */}
              {clubs.map(club => (
                <button
                  key={club.id}
                  onClick={() => { selectClub(club); setShowClubMenu(false) }}
                  className={`premium-menu-item ${selectedClub?.id === club.id ? 'text-[#F59E0B]' : ''}`}
                >
                  <div className="w-6 h-6 rounded bg-[#1A1A1A] border border-[#2A2622] flex items-center justify-center shrink-0">
                    <span className="text-xs text-[#F0EDE8]">{club.name[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[#F0EDE8]">{club.name}</p>
                    <p className="text-xs text-[#F59E0B] capitalize">{club.role}</p>
                  </div>
                  {selectedClub?.id === club.id && <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />}
                </button>
              ))}

              <div className="border-t border-[#2A2622]" />

              {/* Join/Create club */}
              <Link
                href="/clubs/join"
                onClick={() => setShowClubMenu(false)}
                className="premium-menu-item"
              >
                <Plus size={14} />
                Join or create club
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Nav links */}
      <div className="premium-nav">
        <Link href="/dashboard" className="premium-nav-link">
          <Home size={15} />
          Home
        </Link>
        <Link href="/events" className="premium-nav-link">
          <Calendar size={15} />
          Events
        </Link>
        <Link href="/search" className="premium-nav-link">
          <Search size={15} />
          Search
        </Link>
        <Link href="/analytics" className="premium-nav-link">
            <BarChart2 size={15} />
            Analytics
        </Link>
      </div>

      <div className="premium-nav-actions">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={toggleNotifs}
          className="premium-icon-button relative"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#F59E0B] rounded-full" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-10 w-80 bg-[#171717] border border-[#2A2622] rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2A2622]">
                <p className="text-sm font-medium text-[#F0EDE8]">Notifications</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-[#7C7A74] text-sm text-center py-6">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-[#2A2622] hover:bg-[#1A1A1A] transition ${!n.is_read ? 'bg-[#F59E0B]/5' : ''}`}>
                      <p className="text-sm text-[#B5B1AA]">
                        <span className="text-[#F0EDE8] font-medium">{n.from_name}</span> {n.message}
                      </p>
                      <p className="text-xs text-[#7C7A74] mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <Link href="/profile" className="premium-profile">
          <div className="premium-avatar">
            <span className="text-xs text-[#111111] font-semibold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <span className="hidden sm:inline text-sm text-[#B5B1AA]">{user?.name}</span>
        </Link>

        <button
          onClick={handleLogout}
          className="premium-icon-button"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  )
}
