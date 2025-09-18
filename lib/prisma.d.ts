import { PrismaClient, User as PrismaUser, Role } from '@prisma/client';

// Extend NodeJS global to include prisma
declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

// Extend the User type to include the role field
declare module '@prisma/client' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface User extends PrismaUser {
    // Add any custom fields here
  }
}

// Create a new prisma client or use the existing one in development
const prisma: PrismaClient = global._prisma || new PrismaClient();

// In development, store the prisma client in the global object
// to prevent multiple instances of Prisma Client in development
if (process.env.NODE_ENV !== 'production') {
  global._prisma = prisma;
}

export { prisma };
