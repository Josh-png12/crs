import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import SidebarNav from './SidebarNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <SidebarNav userName={session.user?.name ?? 'Admin'} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
