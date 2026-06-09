import Link from 'next/link'
import { Camera, Users, Search, Shield, Zap, Download } from 'lucide-react'

export default function Home() {
  const features = [
    { icon: Camera, title: 'Event albums' },
    { icon: Shield, title: 'Club permissions' },
    { icon: Zap, title: 'AI tagging' },
    { icon: Search, title: 'Fast search' },
    { icon: Users, title: 'Face matching' },
    { icon: Download, title: 'Watermarked downloads' },
  ]

  return (
    <div className="min-h-screen bg-[#111111] text-[#F0EDE8]">
      <nav className="h-14 border-b border-[#2A2622] flex items-center px-5 sm:px-8 justify-between">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-[#F59E0B]" />
          <span className="text-[#F0EDE8] font-semibold text-sm">MediaVault</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[#B5B1AA] hover:text-[#F0EDE8] text-sm transition px-3 py-1.5">
            Sign in
          </Link>
          <Link href="/register" className="bg-[#F59E0B] hover:bg-[#D97706] text-[#111111] text-sm font-semibold px-4 py-1.5 rounded-md transition">
            Get started
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-5 sm:px-8">
        <section className="pt-20 pb-14 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#F0EDE8] mb-4 leading-tight">
            MediaVault for university club media
          </h1>
          <p className="text-[#B5B1AA] text-sm sm:text-base mb-8 max-w-2xl mx-auto leading-relaxed">
            A focused workspace for organizing event photos, managing club access, searching media, and finding the people who appear in your albums.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/register" className="bg-[#F59E0B] hover:bg-[#D97706] text-[#111111] px-5 py-2.5 rounded-md text-sm font-semibold transition">
              Start for free
            </Link>
            <Link href="/login" className="bg-[#171717] hover:bg-[#1A1A1A] border border-[#2A2622] text-[#B5B1AA] hover:text-[#F0EDE8] px-5 py-2.5 rounded-md text-sm transition">
              Sign in
            </Link>
          </div>
        </section>

        <section className="pb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {features.map(({ icon: Icon, title }) => (
              <div key={title} className="bg-[#171717] border border-[#2A2622] rounded-md px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 bg-[#1A1A1A] border border-[#2A2622] rounded-md flex items-center justify-center">
                  <Icon size={15} className="text-[#F59E0B]" />
                </div>
                <h3 className="text-[#F0EDE8] text-sm font-medium">{title}</h3>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#2A2622] py-5 text-center">
        <p className="text-[#7C7A74] text-xs">MediaVault - Event and media management for clubs</p>
      </footer>
    </div>
  )
}
