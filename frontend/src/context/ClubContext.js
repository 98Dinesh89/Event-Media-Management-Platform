'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const ClubContext = createContext()

export const ClubProvider = ({ children }) => {
  const { user } = useAuth()
  const [selectedClub, setSelectedClub] = useState(null) // null = all clubs

  // Reset when user changes
  useEffect(() => {
    setSelectedClub(null)
  }, [user?.id])

  const selectClub = (club) => {
    setSelectedClub(club)
  }

  const currentRole = selectedClub
    ? user?.clubs?.find(c => c.id === selectedClub.id)?.role || 'viewer'
    : null

  return (
    <ClubContext.Provider value={{ selectedClub, selectClub, currentRole }}>
      {children}
    </ClubContext.Provider>
  )
}

export const useClub = () => useContext(ClubContext)