'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { VERSION_CONFIG } from '@/lib/versions';

interface NavbarProps {
  /** Prefix for navigation links, e.g. "/v1". Empty string for root. */
  versionPrefix?: string;
}

export default function Navbar({ versionPrefix = '' }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: `${versionPrefix}`, label: 'Home' },
    { href: `${versionPrefix}/calculator`, label: 'Calculator' },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50" role="navigation" aria-label="Main navigation">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={`${versionPrefix}`} className="text-xl font-semibold text-blue-700 hover:text-blue-800">
            Readmission Risk Tool
          </Link>

          {/* Desktop links + version dropdown */}
          <div className="hidden sm:flex sm:items-center sm:space-x-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <select
              value={versionPrefix}
              onChange={(e) => { window.location.href = e.target.value || '/'; }}
              className="text-sm text-slate-600 border border-slate-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Select model version"
            >
              {VERSION_CONFIG.map((v) => (
                <option key={v.id} value={v.prefix}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-md text-slate-600 hover:text-blue-700 hover:bg-slate-50"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden pb-4 border-t border-slate-100 mt-2 pt-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.href
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <select
              value={versionPrefix}
              onChange={(e) => { window.location.href = e.target.value || '/'; }}
              className="mt-2 w-full text-sm text-slate-600 border border-slate-300 rounded-md px-2 py-1 bg-white"
              aria-label="Select model version"
            >
              {VERSION_CONFIG.map((v) => (
                <option key={v.id} value={v.prefix}>{v.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </nav>
  );
}