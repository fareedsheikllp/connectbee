import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pkg from "@/lib/db/index.js";
import { loginRateLimit } from "@/lib/ratelimit";

const { db: prisma } = pkg;

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours — auto logout after 8hrs
  },
  providers: [
    Credentials({
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip = req?.headers?.get("x-forwarded-for") ?? "global";
        const { success } = await loginRateLimit.limit(ip);
        if (!success) throw new Error("Too many login attempts. Try again in a minute.");

        // ── 1. Check workspace owner first ──────────────────────────
        const owner = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { workspace: true },
        });

        if (owner) {
          if (!owner.password) return null;
          if (owner.status === "inactive") return null;

          const valid = await bcrypt.compare(credentials.password, owner.password);
          if (!valid) return null;

          return {
            id: owner.id,
            email: owner.email,
            name: owner.name,
            role: owner.email === process.env.ADMIN_EMAIL ? "admin" : "owner",
            workspaceId: owner.workspace?.id ?? null,
            memberId: null,
          };
        }

        // ── 2. Check workspace member (agent/supervisor) ────────────
        const member = await prisma.workspaceMember.findFirst({
          where: { email: credentials.email },
          include: { workspace: true },
        });

        if (!member) return null;
        if (!member.isActive) return null;

        const valid = await bcrypt.compare(credentials.password, member.password);
        if (!valid) return null;

        return {
          id: member.id,
          email: member.email,
          name: member.name,
          role: member.role.toLowerCase(), // "agent" or "supervisor"
          workspaceId: member.workspaceId,
          memberId: member.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id          = user.id;
        token.role        = user.role;
        token.workspaceId = user.workspaceId;
        token.memberId    = user.memberId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id          = token.id;
        session.user.role        = token.role;
        session.user.workspaceId = token.workspaceId;
        session.user.memberId    = token.memberId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});