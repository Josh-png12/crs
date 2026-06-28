import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/admin/services/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params

  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      attendances: {
        orderBy: { createdAt: 'asc' },
        include: {
          person: { select: { id: true, firstName: true, lastName: true, type: true } },
        },
      },
      _count: { select: { attendances: true } },
    },
  })

  if (!service) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(service)
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/admin/services/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await request.json()

  const service = await prisma.service.update({
    where: { id },
    data: body,
    include: { _count: { select: { attendances: true } } },
  })

  return Response.json(service)
}
