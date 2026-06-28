import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('AUTH ATTEMPT:', credentials?.email)
        try {
          const email = credentials?.email as string
          const password = credentials?.password as string
          if (!email || !password) return null

          const user = await prisma.user.findUnique({ where: { email } })
          console.log('USER FOUND:', user ? 'yes' : 'no')
          if (!user) return null

          const valid = await bcrypt.compare(password, user.password)
          if (!valid) return null

          return { id: user.id, name: user.name, email: user.email, role: user.role }
        } catch (error) {
          console.error('AUTH ERROR:', error)
          return null
        }
      },
    }),
  ],
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string
        ;(session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },
})
