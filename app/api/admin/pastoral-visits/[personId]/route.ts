import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/admin/pastoral-visits/[personId]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { personId } = await ctx.params

  const visits = await prisma.pastoralVisit.findMany({
    where: { personId },
    orderBy: { visitedAt: 'desc' },
  })

  return Response.json(visits)
}
