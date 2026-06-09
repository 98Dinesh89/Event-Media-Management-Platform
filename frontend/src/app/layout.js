import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/context/SocketContext'
import { ClubProvider } from '@/context/ClubContext'
import './globals.css'

export const metadata = {
  title: 'Event Media Platform',
  description: 'Organize and share event media seamlessly',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ClubProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </ClubProvider>
        </AuthProvider>
      </body>
    </html>
  )
}