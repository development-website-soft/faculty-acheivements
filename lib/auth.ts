import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            department: {
              include: {
                college: true,
              },
            },
          },
        })

        if (!user || user.status !== "ACTIVE") {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash || "")

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId?.toString(),
          departmentName: user.department?.name,
          collegeName: user.department?.college?.name,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.departmentId = user.departmentId
        token.departmentName = user.departmentName
        token.collegeName = user.collegeName
      }
      return token
    },
    async session({ session, token }) {
      if (token?.sub) {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(token.sub) },
          include: {
            department: {
              include: {
                college: true,
              },
            },
          },
        });
        if (user) {
          session.user.id = user.id.toString();
          session.user.name = user.name;
          session.user.email = user.email;
          session.user.role = user.role;
          session.user.departmentId = user.departmentId?.toString();
          session.user.departmentName = user.department?.name;
          session.user.collegeName = user.department?.college?.name;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
