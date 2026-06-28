import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

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

  return Response.json({
    totalMembers,
    totalVisitors,
    avgAttendance,
    lastServiceCount: recentServices[0]?._count.attendances ?? 0,
    chartData,
    inactiveMembers,
  })
}
