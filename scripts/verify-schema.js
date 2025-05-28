// This script verifies that the Prisma schema matches the database schema
const { PrismaClient } = require('@prisma/client');

async function verifySchema() {
  console.log('Verifying Prisma schema against database...');
  
  const prisma = new PrismaClient();
  
  try {
    // Verify isVerified field in User table
    const userVerifiedField = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name = 'isVerified'
    `;
    
    console.log('User isVerified field check:', userVerifiedField);
    
    if (userVerifiedField.length === 0) {
      console.error('WARNING: isVerified column not found in User table!');
      console.log('Attempting to fix schema...');
      
      // Try to add the column if it doesn't exist
      await prisma.$executeRaw`
        ALTER TABLE "User" 
        ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false
      `;
      
      console.log('User schema fix attempted. Please verify.');
    } else {
      console.log('✅ Schema verification successful: isVerified column exists in User table');
    }

    // Verify UUID default values are working
    const verificationIdDefault = await prisma.$queryRaw`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_name = 'Verification'
      AND column_name = 'id'
    `;

    console.log('Verification id default check:', verificationIdDefault);

    if (verificationIdDefault.length === 0 || !verificationIdDefault[0].column_default) {
      console.error('WARNING: UUID default function may not be set up correctly for Verification table!');
      console.log('Attempting to ensure UUID extension is enabled...');
      
      // Enable UUID extension if not already enabled
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
      
      console.log('UUID extension enabled. Please verify.');
    } else {
      console.log('✅ Schema verification successful: UUID defaults are properly configured');
    }

    // Verify updatedAt default in Verification table
    const verificationUpdatedAt = await prisma.$queryRaw`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_name = 'Verification'
      AND column_name = 'updatedAt'
    `;

    console.log('Verification updatedAt default check:', verificationUpdatedAt);

    if (verificationUpdatedAt.length === 0 || !verificationUpdatedAt[0].column_default) {
      console.error('WARNING: updatedAt default value not set correctly in Verification table!');
      console.log('Attempting to fix schema...');
      
      // Try to set the default value if it doesn't exist
      await prisma.$executeRaw`
        ALTER TABLE "Verification" 
        ALTER COLUMN "updatedAt" SET DEFAULT now()
      `;
      
      console.log('Verification schema fix attempted. Please verify.');
    } else {
      console.log('✅ Schema verification successful: updatedAt default exists in Verification table');
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
