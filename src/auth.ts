import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./lib/db";
import { accounts, sessions, users, verificationTokens } from "./lib/db/schema";
import Credentials from "next-auth/providers/credentials";
import authConfig from "./auth.config";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      name: "Master Password",
      credentials: {
        username: { label: "ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = (credentials.username as string)?.trim();
        const password = (credentials.password as string)?.trim();
        const masterPassword = process.env.MASTER_PASSWORD || "Admin@user1234";
        const ownerEmail = process.env.OWNER_EMAIL || "Nibbatoni57";
        
        if (username !== ownerEmail || password !== masterPassword) {
          console.error(`Login failed. Expected: ${ownerEmail} / ${masterPassword}. Got: ${username} / ${password}`);
          return null; // Invalid credentials
        }
        
        // Find existing owner user
        const existingUsers = await db.select().from(users).where(eq(users.email, ownerEmail));
        let user = existingUsers[0];

        // Auto-create owner if it doesn't exist
        if (!user) {
          const now = new Date();
          const [newUser] = await db.insert(users).values({
            id: crypto.randomUUID(),
            email: ownerEmail,
            name: "Owner",
            emailVerified: now,
            createdAt: now,
            updatedAt: now,
          }).returning();
          user = newUser;
        }

        return user;
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      return true; // Authorized by Credentials
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
