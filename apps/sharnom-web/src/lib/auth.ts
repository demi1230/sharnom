import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Load user role from database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });
      
      if (session.user && dbUser) {
        session.user.role = dbUser.role;
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});

export const { GET, POST } = handlers;
