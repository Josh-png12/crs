import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''

  if (!q.trim()) return Response.json([])

  const persons = await prisma.person.findMany({
    where: {
      OR: [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ],
      status: 'ACTIVE',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      type: true,
      phone: true,
      photoUrl: true,
    },
    take: 20,
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })

  return Response.json(persons)
}
