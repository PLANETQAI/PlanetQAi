import { PrismaClient, User as PrismaUser, Role } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

// Extend the User type to include the role field
declare module '@prisma/client' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface User extends PrismaUser {
    role: Role;
  }
}
