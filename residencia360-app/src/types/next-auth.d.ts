import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      apartmentId?: string | null;
      towerId?: string | null;
    };
  }

  interface User {
    role: Role;
    apartmentId?: string | null;
    towerId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    apartmentId?: string | null;
    towerId?: string | null;
  }
}
