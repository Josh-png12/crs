'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: '▣', exact: true },
  { label: 'Personas', href: '/admin/personas', icon: '◎' },
  { label: 'Servicios', href: '/admin/servicios', icon: '⬡' },
  { label: 'Grupos', href: '/admin/grupos', icon: '◈' },
  { label: 'Asistencia', href: '/admin/asistencia', icon: '◉' },
]

export default function SidebarNav({ userName }: { userName: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">CSR</p>
        <p className="text-sm text-gray-500 mt-0.5 truncate">{userName}</p>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(item => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span>↩</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
