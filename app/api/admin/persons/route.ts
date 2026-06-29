import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { NextRequest } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const persons = await prisma.person.findMany({
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      type: true,
      phone: true,
      neighborhood: true,
      status: true,
      joinedAt: true,
      createdAt: true,
      photoUrl: true,
    },
  })

  return Response.json(persons)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await request.json()

    if (data.birthDate) data.birthDate = new Date(data.birthDate)
    if (data.joinedAt) data.joinedAt = new Date(data.joinedAt)

    const person = await prisma.person.create({ data })
    return Response.json(person, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/persons error:', err)
    return Response.json({ error: 'Error al crear persona' }, { status: 500 })
  }
}
