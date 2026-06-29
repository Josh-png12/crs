import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { NextRequest } from 'next/server'

export async function PUT(_req: NextRequest, ctx: RouteContext<'/api/admin/prayer-requests/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params

  try {
    const updated = await prisma.prayerRequest.update({
      where: { id },
      data: { isActive: false, resolvedAt: new Date() },
    })
    return Response.json(updated)
  } catch (err) {
    console.error('PUT /api/admin/prayer-requests/[id] error:', err)
    return Response.json({ error: 'Error al actualizar petición' }, { status: 500 })
  }
}
