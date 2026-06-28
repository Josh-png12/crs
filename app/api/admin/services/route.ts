import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { NextRequest } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const services = await prisma.service.findMany({
    orderBy: { date: 'desc' },
    include: { _count: { select: { attendances: true } } },
  })

  return Response.json(services)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, type, date } = await request.json()

  const service = await prisma.service.create({
    data: { name, type, date: new Date(date) },
    include: { _count: { select: { attendances: true } } },
  })

  return Response.json(service, { status: 201 })
}
