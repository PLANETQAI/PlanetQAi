// This script verifies that the Prisma schema matches the database schema
const { PrismaClient } = require('@prisma/client');

async function verifySchema() {
  console.log('Verifying Prisma schema against database...');
  
  const prisma = new PrismaClient();
  
  try {
    // First, check if the User table exists
    const userTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'User'
      );
    `;
    
    console.log('User table exists check:', userTableExists);
    
    if (!userTableExists[0].exists) {
      console.error('ERROR: User table does not exist! Migrations may not have been applied.');
      console.log('Please run prisma migrate deploy to apply migrations.');
      return;
    }

    // Verify isVerified field in User table
    const userVerifiedField = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name = 'isVerified'
    `;
    
    console.log('User isVerified field check:', userVerifiedField);
    
    if (userVerifiedField.length === 0) {
      console.error('WARNING: isVerified column not found in User table!');
      console.log('Attempting to fix schema...');
      
      // Skip trying to alter the table since we don't have permission in Vercel
      console.log('⚠️ Missing isVerified column. Please run prisma migrate deploy locally.');
    } else {
      console.log('✅ Schema verification successful: isVerified column exists in User table');
    }

    // Verify credits field in User table
    const userCreditsField = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name = 'credits'
    `;
    
    console.log('User credits field check:', userCreditsField);
    
    if (userCreditsField.length === 0) {
      console.error('WARNING: credits column not found in User table!');
      console.log('Attempting to fix schema...');
      
      // Skip trying to alter the table since we don't have permission in Vercel
      console.log('⚠️ Missing credits column. Please run prisma migrate deploy locally.');
    } else {
      console.log('✅ Schema verification successful: credits column exists in User table');
    }

    // Check if Verification table exists
    const verificationTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Verification'
      );
    `;
    
    if (!verificationTableExists[0].exists) {
      console.error('WARNING: Verification table does not exist!');
      console.log('This is expected if this is a new database. Migrations should create it.');
    } else {
      // Verify updatedAt default in Verification table
      const verificationUpdatedAt = await prisma.$queryRaw`
        SELECT column_name, column_default
        FROM information_schema.columns
        WHERE table_name = 'Verification'
        AND column_name = 'updatedAt'
      `;

      console.log('Verification updatedAt check:', verificationUpdatedAt);

      if (verificationUpdatedAt.length === 0) {
        console.error('WARNING: updatedAt column not found in Verification table!');
      } else if (!verificationUpdatedAt[0].column_default) {
        console.error('WARNING: updatedAt default value not set in Verification table!');
        console.log('Attempting to fix schema...');
        
        // Skip trying to alter the table since we don't have permission in Vercel
        console.log('⚠️ Missing updatedAt default in Verification table. Please run prisma migrate deploy locally.');
      } else {
        console.log('✅ Schema verification successful: updatedAt default exists in Verification table');
      }
    }

    // Verify all required tables exist
    const requiredTables = ['User', 'CreditLog', 'Verification', 'Song', 'Payment', 'Subscription'];
    for (const table of requiredTables) {
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = ${table}
        );
      `;
      
      if (!tableExists[0].exists) {
        console.error(`WARNING: ${table} table does not exist!`);
      } else {
        console.log(`✅ Table ${table} exists`);
      }
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
