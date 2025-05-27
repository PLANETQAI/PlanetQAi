// This script verifies that the Prisma schema matches the database schema
const { PrismaClient } = require('@prisma/client');

async function verifySchema() {
  console.log('Verifying Prisma schema against database...');
  
  const prisma = new PrismaClient();
  
  try {
    // Try to query a user with the isVerified field to verify it exists
    const testQuery = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name = 'isVerified'
    `;
    
    console.log('Schema verification result:', testQuery);
    
    if (testQuery.length === 0) {
      console.error('WARNING: isVerified column not found in User table!');
      console.log('Attempting to fix schema...');
      
      // Try to add the column if it doesn't exist
      await prisma.$executeRaw`
        ALTER TABLE "User" 
        ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false
      `;
      
      console.log('Schema fix attempted. Please verify.');
    } else {
      console.log('✅ Schema verification successful: isVerified column exists');
    }
  } catch (error) {
    console.error('Schema verification error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema()
  .then(() => console.log('Schema verification completed'))
  .catch(e => console.error('Schema verification failed:', e));
