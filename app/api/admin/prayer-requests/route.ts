import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const personId = request.nextUrl.searchParams.get('personId')
  if (!personId) return Response.json({ error: 'personId requerido' }, { status: 400 })

  const requests = await prisma.prayerRequest.findMany({
    where: { personId },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  })

  return Response.json(requests)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { personId, content } = await request.json()
    if (!personId || !content) {
      return Response.json({ error: 'personId y content son requeridos' }, { status: 400 })
    }

    const prayerRequest = await prisma.prayerRequest.create({
      data: { personId, content },
    })

    return Response.json(prayerRequest, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/prayer-requests error:', err)
    return Response.json({ error: 'Error al crear petición' }, { status: 500 })
  }
}
