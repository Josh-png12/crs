import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { NextRequest } from 'next/server'

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/admin/users/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as { role?: string }).role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await ctx.params

  const currentUserId = (session.user as { id?: string }).id
  if (id === currentUserId) {
    return Response.json({ error: 'No puedes eliminar tu propio usuario' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })
  return Response.json({ ok: true })
}
