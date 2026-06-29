import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { hash } from 'bcryptjs'
import type { NextRequest } from 'next/server'

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/admin/users/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as { role?: string }).role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await ctx.params
  const currentUserId = (session.user as { id?: string }).id

  try {
    const { name, email, role, password } = await req.json()

    if (!name || !email || !role) {
      return Response.json({ error: 'name, email y role son requeridos' }, { status: 400 })
    }

    const data: Record<string, unknown> = { name, email, role }

    if (id === currentUserId && role !== (session.user as { role?: string }).role) {
      return Response.json({ error: 'No puedes cambiar tu propio rol' }, { status: 400 })
    }

    if (password && password.trim().length > 0) {
      data.password = await hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return Response.json(user)
  } catch (err) {
    console.error('PUT /api/admin/users/[id] error:', err)
    return Response.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

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
