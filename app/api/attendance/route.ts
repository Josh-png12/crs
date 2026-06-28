import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { personId, serviceId, method = 'DOORMAN' } = await request.json()

  const person = await prisma.person.findUnique({
    where: { id: personId },
    select: { type: true },
  })

  if (!person) {
    return Response.json({ error: 'Person not found' }, { status: 404 })
  }

  try {
    const attendance = await prisma.attendance.create({
      data: {
        personId,
        serviceId,
        method,
        wasVisitor: person.type === 'VISITOR',
      },
    })
    return Response.json(attendance, { status: 201 })
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === 'P2002') {
      const existing = await prisma.attendance.findFirst({ where: { personId, serviceId } })
      return Response.json({ alreadyRegistered: true, attendance: existing })
    }
    throw err
  }
}
