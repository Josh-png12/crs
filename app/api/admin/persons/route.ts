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
    },
  })

  return Response.json(persons)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await request.json()

  const person = await prisma.person.create({ data })
  return Response.json(person, { status: 201 })
}
