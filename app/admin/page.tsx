import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import AttendanceChart from './AttendanceChart'

async function getDashboardData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const twentyOneDaysAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)

  const [totalMembers, totalVisitors, recentServices, inactiveMembers] = await Promise.all([
    prisma.person.count({ where: { type: 'MEMBER', status: 'ACTIVE' } }),
    prisma.person.count({ where: { type: 'VISITOR' } }),
    prisma.service.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: { _count: { select: { attendances: true } } },
    }),
    prisma.person.findMany({
      where: {
        type: 'MEMBER',
        status: 'ACTIVE',
        attendances: { none: { createdAt: { gte: twentyOneDaysAgo } } },
      },
      select: { id: true, firstName: true, lastName: true, phone: true },
      take: 30,
    }),
  ])

  const last30Days = recentServices.filter(s => new Date(s.date) >= thirtyDaysAgo)
  const avgAttendance = last30Days.length > 0
    ? Math.round(last30Days.reduce((sum, s) => sum + s._count.attendances, 0) / last30Days.length)
    : 0

  const chartData = [...recentServices].reverse().map(s => ({
    name: new Date(s.date).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
    asistentes: s._count.attendances,
  }))

  return {
    totalMembers,
    totalVisitors,
    avgAttendance,
    lastServiceCount: recentServices[0]?._count.attendances ?? 0,
    chartData,
    inactiveMembers,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  const cards = [
    { label: 'Miembros activos', value: data.totalMembers, color: 'text-blue-600' },
    { label: 'Visitantes', value: data.totalVisitors, color: 'text-purple-600' },
    { label: 'Prom. asistencia (30d)', value: data.avgAttendance, color: 'text-green-600' },
    { label: 'Último servicio', value: data.lastServiceCount, color: 'text-orange-600' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen general de la congregación</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
            <p className={`text-3xl font-bold mt-2 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Asistencia — últimos 10 servicios</h2>
        {data.chartData.length > 0 ? (
          <AttendanceChart data={data.chartData} />
        ) : (
          <p className="text-gray-400 text-sm py-8 text-center">Sin datos de servicios aún</p>
        )}
      </div>

      {/* Inactive members */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Miembros sin asistir en 21+ días
          <span className="ml-2 text-xs font-normal bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
            {data.inactiveMembers.length}
          </span>
        </h2>
        {data.inactiveMembers.length === 0 ? (
          <p className="text-gray-400 text-sm">Todos asistieron recientemente</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.inactiveMembers.map(p => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    {p.firstName} {p.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {p.phone && <span className="text-xs text-gray-400">{p.phone}</span>}
                  <Link
                    href={`/admin/personas/${p.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver ficha →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
