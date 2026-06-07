import Link from 'next/link'
import { Camera, Users, Search, Shield, Zap, Download } from 'lucide-react'

export default function Home() {
  const features = [
    { icon: Camera, title: 'Event albums', desc: 'Organize photos and videos by event with metadata and categories' },
    { icon: Shield, title: 'Access control', desc: 'Public and private albums with role-based permissions' },
    { icon: Zap, title: 'AI tagging', desc: 'Automatic smart tags generated for every uploaded image' },
    { icon: Search, title: 'Advanced search', desc: 'Search by event, tag, date, or uploader name instantly' },
    { icon: Users, title: 'Face recognition', desc: 'Upload a selfie to find all photos you appear in' },
    { icon: Download, title: 'Watermarked downloads', desc: 'Auto watermark with club and event name on download' },
  ]

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Navbar */}
      <nav className="h-14 border-b border-[#1e1e1e] flex items-center px-8 justify-between">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-purple-400" />
          <span className="text-white font-semibold text-sm">MediaVault</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-gray-400 hover:text-white text-sm transition px-3 py-1.5">
            Sign in
          </Link>
          <Link href="/register" className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-1.5 rounded-lg transition">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-8 pt-24 pb-20 text-center">
        <div className="inline-block bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs px-3 py-1 rounded-full mb-6">
          Built for clubs and organizations
        </div>
        <h1 className="text-4xl font-semibold text-white mb-4 leading-tight">
          One place for all your<br />event media
        </h1>
        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
          Upload, organize, and share event photos and videos. AI-powered tagging, face recognition, and real-time notifications built in.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/register" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
            Start for free
          </Link>
          <Link href="/login" className="bg-[#141414] hover:bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 px-6 py-2.5 rounded-lg text-sm transition">
            Sign in
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3">
                <Icon size={16} className="text-purple-400" />
              </div>
              <h3 className="text-white text-sm font-medium mb-1">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#1e1e1e] py-6 text-center">
        <p className="text-gray-600 text-xs">MediaVault — Event & Media Management Platform</p>
      </div>
    </div>
  )
}