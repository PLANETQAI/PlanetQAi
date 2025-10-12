import { PrismaClient, User as PrismaUser, Role } from '@prisma/client';

// Extend the User type to include the role field
declare module '@prisma/client' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface User extends PrismaUser {
    role: Role;
  }
}

// Create a new prisma client or use the existing one in development
const prisma: PrismaClient = globalThis._prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  globalThis._prisma = prisma;
}

export default prisma;
