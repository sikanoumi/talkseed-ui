// types/next-auth.d.ts
import "@auth/core/types";
import "next-auth/jwt";

// User の実体は @auth/core/types にある。next-auth はここから re-export しているだけ。
// Session.user?: User なので User を拡張すれば session.user.oid が解決される。
declare module "@auth/core/types" {
  interface User {
    oid?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    expiresAt?: number;
    email?: string | null;
    name?: string | null;
    oid?: string;
  }
}