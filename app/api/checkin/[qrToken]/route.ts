import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/checkin/[qrToken]'>) {
  const { qrToken } = await ctx.params

  const service = await prisma.service.findUnique({
    where: { qrToken },
    select: { id: true, name: true, type: true, date: true, isOpen: true },
  })

  if (!service || !service.isOpen) {
    return Response.json({ error: 'Servicio no disponible' }, { status: 404 })
  }

  return Response.json(service)
}
