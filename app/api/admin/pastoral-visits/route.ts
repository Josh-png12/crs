import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { personId, visitedAt, outcome, notes } = await request.json()
    if (!personId || !visitedAt) {
      return Response.json({ error: 'personId y visitedAt son requeridos' }, { status: 400 })
    }

    const visit = await prisma.pastoralVisit.create({
      data: {
        personId,
        visitedAt: new Date(visitedAt),
        outcome: outcome || null,
        notes: notes || null,
      },
    })

    return Response.json(visit, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/pastoral-visits error:', err)
    return Response.json({ error: 'Error al registrar visita' }, { status: 500 })
  }
}
