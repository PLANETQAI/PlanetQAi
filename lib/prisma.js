import { PrismaClient } from '@prisma/client'
// Removed Accelerate import to fix database connection issues

const prismaClientSingleton = () => {
	// Create a standard PrismaClient instance without Accelerate
	return new PrismaClient()
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
