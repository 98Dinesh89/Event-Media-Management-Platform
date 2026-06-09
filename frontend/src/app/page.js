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
    <div className="public-page">
      <nav className="public-nav">
        <div className="premium-brand">
          <Camera size={18} className="text-[#F59E0B]" />
          <span>MediaVault</span>
        </div>
      </nav>

      <main className="public-main">
        <section className="public-hero">
          <div>
            <h1 className="public-title">MediaVault for university club media</h1>
            <p className="public-copy">
              Organize event photos, manage club access, search media, and help members find the people who appear in every album.
            </p>
            <div className="public-actions">
              <Link href="/register" className="premium-button premium-button-primary">
                Start for free
              </Link>
              <Link href="/login" className="premium-button premium-button-secondary">
                Sign in
              </Link>
            </div>
          </div>

          <div className="public-panel">
            <p className="public-panel-title">Workspace overview</p>
            <div className="public-preview-grid">
              <div className="public-preview-tile">
                <Camera size={20} />
                <div>
                  <p className="text-sm font-semibold text-[#F0EDE8]">Albums</p>
                  <p className="text-xs text-[#7C7A74] mt-1">Event media in one place</p>
                </div>
              </div>
              <div className="public-preview-tile">
                <Shield size={20} />
                <div>
                  <p className="text-sm font-semibold text-[#F0EDE8]">Roles</p>
                  <p className="text-xs text-[#7C7A74] mt-1">Admin, member, viewer</p>
                </div>
              </div>
              <div className="public-preview-tile">
                <Search size={20} />
                <div>
                  <p className="text-sm font-semibold text-[#F0EDE8]">Search</p>
                  <p className="text-xs text-[#7C7A74] mt-1">Find photos quickly</p>
                </div>
              </div>
              <div className="public-preview-tile">
                <Users size={20} />
                <div>
                  <p className="text-sm font-semibold text-[#F0EDE8]">Face matches</p>
                  <p className="text-xs text-[#7C7A74] mt-1">Personal media discovery</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="feature-grid">
            {features.map(({ icon: Icon, title }, index) => (
              <div key={title} className="feature-card">
                <div className="feature-icon">
                  <Icon size={18} className={index === 2 ? 'text-[#38BDF8]' : index === 4 ? 'text-[#A78BFA]' : 'text-[#F59E0B]'} />
                </div>
                <h3 className="text-[#F0EDE8] text-sm font-semibold">{title}</h3>
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
