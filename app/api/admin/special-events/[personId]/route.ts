import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/admin/special-events/[personId]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { personId } = await ctx.params

  const events = await prisma.specialEvent.findMany({
    where: { personId },
    orderBy: { date: 'desc' },
  })

  return Response.json(events)
}
