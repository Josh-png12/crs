import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/admin/pastoral-notes/[personId]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { personId } = await ctx.params

  const notes = await prisma.pastoralNote.findMany({
    where: { personId },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json(notes)
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/admin/pastoral-notes/[personId]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { personId } = await ctx.params
  const { content, isPrivate = true } = await request.json()

  const note = await prisma.pastoralNote.create({
    data: { personId, content, isPrivate },
  })

  return Response.json(note, { status: 201 })
}
