import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/admin/persons/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params

  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      attendances: {
        orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { name: true, date: true, type: true } },
        },
      },
    },
  })

  if (!person) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(person)
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/admin/persons/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await request.json()

  const {
    firstName, lastName, phone, whatsapp, email, birthDate, gender,
    address, neighborhood, city, type, status, joinedAt,
    maritalStatus, occupation, photoUrl,
  } = body

  const person = await prisma.person.update({
    where: { id },
    data: {
      firstName,
      lastName,
      phone: phone || null,
      whatsapp: whatsapp || null,
      email: email || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender: gender || null,
      address: address || null,
      neighborhood: neighborhood || null,
      city: city || null,
      type,
      status,
      joinedAt: joinedAt ? new Date(joinedAt) : null,
      maritalStatus: maritalStatus || null,
      occupation: occupation || null,
      photoUrl: photoUrl || null,
    },
  })

  return Response.json(person)
}
