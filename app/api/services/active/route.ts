import { prisma } from '@/lib/prisma'

export async function GET() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  const services = await prisma.service.findMany({
    where: {
      isOpen: true,
      date: { gte: startOfDay, lt: endOfDay },
    },
    orderBy: { date: 'asc' },
  })

  return Response.json(services)
}
