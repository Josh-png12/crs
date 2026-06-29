import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import AttendanceChart from './AttendanceChart'

async function getDashboardData() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    totalMembers,
    totalVisitors,
    recentServices,
    inactiveMembers,
    personsWithBirthday,
    topInviters,
    visitorsWithCount,
    activePrayerRequests,
  ] = await Promise.all([
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
    prisma.person.findMany({
      where: { birthDate: { not: null }, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, birthDate: true, type: true },
    }),
    prisma.person.findMany({
      where: { invitations: { some: {} } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        type: true,
        _count: { select: { invitations: true } },
      },
      orderBy: { invitations: { _count: 'desc' } },
      take: 5,
    }),
    prisma.person.findMany({
      where: { type: 'VISITOR', attendances: { some: {} } },
      include: { _count: { select: { attendances: true } } },
    }),
    prisma.prayerRequest.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { person: { select: { id: true, firstName: true, lastName: true } } },
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

  // Birthdays in next 7 days (ignoring year)
  const birthdaysThisWeek = personsWithBirthday.filter(p => {
    const bday = new Date(p.birthDate!)
    const thisYear = now.getFullYear()
    const thisYearBday = new Date(thisYear, bday.getMonth(), bday.getDate())
    const check = thisYearBday >= now ? thisYearBday : new Date(thisYear + 1, bday.getMonth(), bday.getDate())
    return check >= now && check <= nextWeek
  }).map(p => ({
    ...p,
    bdayDate: (() => {
      const bday = new Date(p.birthDate!)
      const thisYear = now.getFullYear()
      const d = new Date(thisYear, bday.getMonth(), bday.getDate())
      return d >= now ? d : new Date(thisYear + 1, bday.getMonth(), bday.getDate())
    })(),
  })).sort((a, b) => a.bdayDate.getTime() - b.bdayDate.getTime())

  // Retention rate
  const totalVisitorsAttended = visitorsWithCount.length
  const retainedVisitors = visitorsWithCount.filter(v => v._count.attendances >= 2).length
  const retentionRate = totalVisitorsAttended > 0
    ? Math.round((retainedVisitors / totalVisitorsAttended) * 100)
    : 0

  return {
    totalMembers,
    totalVisitors,
    avgAttendance,
    lastServiceCount: recentServices[0]?._count.attendances ?? 0,
    chartData,
    inactiveMembers,
    birthdaysThisWeek,
    topInviters,
    retentionRate,
    retainedVisitors,
    totalVisitorsAttended,
    activePrayerRequests,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  const cards = [
    { label: 'Miembros activos', value: data.totalMembers, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Visitantes', value: data.totalVisitors, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Prom. asistencia (30d)', value: data.avgAttendance, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Último servicio', value: data.lastServiceCount, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 pt-14 md:pt-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen general de la congregación</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
            <p className={`text-3xl font-bold mt-2 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Asistencia — últimos 10 servicios</h2>
        {data.chartData.length > 0
          ? <AttendanceChart data={data.chartData} />
          : <p className="text-gray-400 text-sm py-8 text-center">Sin datos de servicios aún</p>
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Birthdays this week */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            🎂 Cumpleaños esta semana
            <span className="ml-2 text-xs font-normal bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">
              {data.birthdaysThisWeek.length}
            </span>
          </h2>
          {data.birthdaysThisWeek.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin cumpleaños en los próximos 7 días</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.birthdaysThisWeek.map(p => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-gray-400">
                        {p.bdayDate.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.type === 'MEMBER' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {p.type === 'MEMBER' ? 'Miembro' : 'Visitante'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top inviters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">🏆 Top invitadores</h2>
          {data.topInviters.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin datos de invitaciones aún</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.topInviters.map((p, i) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-5 text-center ${
                      i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-300'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-xs font-bold text-yellow-700">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <Link href={`/admin/personas/${p.id}`} className="text-sm font-medium text-gray-800 hover:text-blue-600">
                      {p.firstName} {p.lastName}
                    </Link>
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    {p._count.invitations} <span className="text-xs font-normal text-gray-400">inv.</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Retention rate */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tasa de retención de visitantes</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-green-600">{data.retentionRate}%</p>
              <p className="text-xs text-gray-400 mb-1 leading-snug">
                {data.retainedVisitors} de {data.totalVisitorsAttended} visitantes<br />volvieron al menos una vez
              </p>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${data.retentionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active prayer requests */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            🙏 Peticiones de oración activas
            <span className="ml-2 text-xs font-normal bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
              {data.activePrayerRequests.length}
            </span>
          </h2>
          {data.activePrayerRequests.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin peticiones activas</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.activePrayerRequests.map(pr => (
                <div key={pr.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0 mt-0.5">
                      {pr.person.firstName[0]}{pr.person.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{pr.person.firstName} {pr.person.lastName}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{pr.content}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(pr.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <Link href={`/admin/personas/${pr.person.id}`} className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    Ver ficha →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inactive members */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            ⚠️ Miembros sin asistir en 21+ días
            <span className="ml-2 text-xs font-normal bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
              {data.inactiveMembers.length}
            </span>
          </h2>
          {data.inactiveMembers.length === 0 ? (
            <p className="text-gray-400 text-sm">Todos los miembros asistieron recientemente</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.inactiveMembers.map(p => (
                <div key={p.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.firstName} {p.lastName}</p>
                      {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.phone && (
                      <a
                        href={`https://wa.me/57${p.phone.replace(/\D/g, '')}?text=Hola+${encodeURIComponent(p.firstName)}%2C+te+extra%C3%B1amos+en+la+iglesia+%F0%9F%99%8F`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
                      >
                        <span>WhatsApp</span>
                      </a>
                    )}
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
    </div>
  )
}
