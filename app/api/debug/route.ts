import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  let dbTest = 'failed'
  let dbError = ''
  try {
    await prisma.user.count()
    dbTest = 'ok'
  } catch (e: any) {
    dbError = e.message
  }

  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED ? 'set' : 'missing',
    AUTH_SECRET: process.env.AUTH_SECRET ? 'set' : 'missing',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'missing',
    NODE_ENV: process.env.NODE_ENV,
    dbTest,
    dbError,
  })
}
