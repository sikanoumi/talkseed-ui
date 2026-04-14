import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  debug: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      authorization: {
        params: {
          scope: "openid profile offline_access User.Read Calendars.Read",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }: any) {
      console.log("[auth:jwt:start]", {
        hasAccount: !!account,
        hasProfile: !!profile,
      });

      if (account) {
        console.log("[auth:jwt:account]", {
          provider: account.provider,
          type: account.type,
          hasAccessToken: !!account.access_token,
          expiresAt: account.expires_at,
        });
      }

      if (profile) {
        token.name = profile.name ?? token.name;

        const p = profile as {
          email?: string;
          preferred_username?: string;
          oid?: string;
          sub?: string;
        };

        console.log("[auth:jwt:profile:oid]", {
          oid: p.oid,
          sub: p.sub ?? token.sub,
        });

        token.email = p.email ?? p.preferred_username ?? token.email;
        if (p.oid) {
          token.oid = p.oid;
        } else if (token.sub) {
          token.oid = token.sub;
        }
      }

      console.log("[auth:jwt:end]", {
        email: token.email,
        name: token.name,
        oid: token.oid,
        sub: token.sub,
      });

      return token;
    },

    async session({ session, token }: any) {
      console.log("[auth:session:start]", {
        hasSessionUser: !!session.user,
      });

      if (session.user) {
        session.user.name = token.name ?? session.user.name;
        session.user.email =
          typeof token.email === "string" ? token.email : session.user.email;
        if (token.oid) session.user.oid = token.oid;
      }

      console.log("[auth:session:end]", {
        name: session.user?.name,
        email: session.user?.email,
        oid: session.user?.oid,
      });

      return session;
    },
  },
});