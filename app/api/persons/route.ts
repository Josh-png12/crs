import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    firstName, lastName, phone, type, invitedById,
    email, birthDate, address, neighborhood, howTheyArrived,
  } = body

  const person = await prisma.person.create({
    data: {
      firstName,
      lastName,
      phone: phone || null,
      type: type ?? 'VISITOR',
      invitedById: invitedById || null,
      email: email || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      address: address || null,
      neighborhood: neighborhood || null,
      howTheyArrived: howTheyArrived || null,
    },
  })

  return Response.json(person, { status: 201 })
}
