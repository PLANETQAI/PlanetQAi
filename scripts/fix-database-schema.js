// This script checks and fixes all required columns in the User table
const { PrismaClient } = require('@prisma/client');

async function fixDatabaseSchema() {
  console.log('Checking database schema for missing columns...');
  
  const prisma = new PrismaClient();
  
  try {
    // Get all columns from the User table
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User'
    `;
    
    console.log('Existing columns in User table:', columns.map(c => c.column_name));
    
    // Define required columns with their data types
    const requiredColumns = [
      { name: 'isVerified', type: 'BOOLEAN', default: 'false' },
      { name: 'totalCreditsUsed', type: 'INTEGER', default: '0' },
      { name: 'maxMonthlyCredits', type: 'INTEGER', default: '0' },
      { name: 'max_download', type: 'INTEGER', default: '0' },
      { name: 'totalDownloads', type: 'INTEGER', default: '0' },
      { name: 'isSuspended', type: 'BOOLEAN', default: 'false' },
      { name: 'credits', type: 'INTEGER', default: '0' }
    ];
    
    // Check each required column and add it if missing
    for (const column of requiredColumns) {
      const exists = columns.some(c => c.column_name === column.name);
      
      if (!exists) {
        console.log(`Adding missing column: ${column.name} (${column.type})`);
        
        await prisma.$executeRaw`
          ALTER TABLE "User" 
          ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type} NOT NULL DEFAULT ${column.default}
        `;
        
        console.log(`Column ${column.name} added successfully`);
      } else {
        console.log(`Column ${column.name} already exists`);
      }
    }
    
    // Verify all columns now exist
    const updatedColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User'
    `;
    
    console.log('Updated columns in User table:', updatedColumns.map(c => c.column_name));
    
    // Check if all required columns exist now
    const missingColumns = requiredColumns.filter(
      req => !updatedColumns.some(col => col.column_name === req.name)
    );
    
    if (missingColumns.length === 0) {
      console.log('✅ All required columns exist in the User table');
    } else {
      console.error('❌ Some columns are still missing:', missingColumns.map(c => c.name));
    }
    
  } catch (error) {
    console.error('Error fixing database schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabaseSchema()
  .then(() => console.log('Database schema fix completed'))
  .catch(e => console.error('Database schema fix failed:', e));
