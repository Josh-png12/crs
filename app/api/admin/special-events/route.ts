import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { personId, type, date, notes } = await request.json()
    if (!personId || !type || !date) {
      return Response.json({ error: 'personId, type y date son requeridos' }, { status: 400 })
    }

    const event = await prisma.specialEvent.create({
      data: {
        personId,
        type,
        date: new Date(date),
        notes: notes || null,
      },
    })

    return Response.json(event, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/special-events error:', err)
    return Response.json({ error: 'Error al registrar evento' }, { status: 500 })
  }
}
