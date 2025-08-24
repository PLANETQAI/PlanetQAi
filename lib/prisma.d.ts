import { PrismaClient, User, Role } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Extend the User type to include the role field
declare module '@prisma/client' {
  interface User {
    role: Role;
  }
}

const prisma: PrismaClient = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export { prisma };
