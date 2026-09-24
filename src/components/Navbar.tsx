'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'

const navItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/>
        <rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/tips',
    label: 'Gorjetas',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
  },
  {
    href: '/vales',
    label: 'Vales',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
  },
  {
    href: '/employees',
    label: 'Funcionários',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'Histórico',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
        <path d="M12 7v5l4 2"/>
      </svg>
    ),
  },
]

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'var(--bg-secondary)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        maxWidth: '72rem',
        margin: '0 auto',
        padding: '0 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '4rem',
      }}>
        {/* Logo */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          color: 'var(--text-primary)',
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '0.5rem',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.0625rem', letterSpacing: '-0.01em' }}>
            Gorjeta Mira
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden-mobile">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ThemeToggle />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="btn btn-ghost btn-sm show-mobile"
            aria-label="Menu"
            id="mobile-menu-toggle"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '0.75rem 1rem',
        }} className="show-mobile">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                  backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                  textDecoration: 'none',
                  marginBottom: '0.25rem',
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </div>
      )}

      <style jsx>{`
        .hidden-mobile { display: flex; }
        .show-mobile { display: none; }
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
