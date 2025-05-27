// This script checks and fixes the admin user in the database
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function fixAdminUser() {
  console.log('Checking admin user in database...');
  
  const prisma = new PrismaClient();
  
  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@planetqai.com' },
    });
    
    console.log('Admin user check result:', adminUser ? 'Found' : 'Not found');
    
    if (!adminUser) {
      console.log('Creating admin user...');
      
      // Create admin user with all required fields
      const newAdmin = await prisma.user.create({
        data: {
          fullName: 'Admin User',
          email: 'admin@planetqai.com',
          password: bcrypt.hashSync('Admin123!', 10),
          role: 'Admin',
          isVerified: true,
          credits: 1000,
          totalCreditsUsed: 0,
          maxMonthlyCredits: 0,
          max_download: 0,
          totalDownloads: 0,
          isSuspended: false,
        },
      });
      
      console.log('Admin user created successfully:', newAdmin.email);
    } else {
      console.log('Updating admin user...');
      
      // Update admin user to ensure all fields are correct
      const updatedAdmin = await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          fullName: 'Admin User',
          password: bcrypt.hashSync('Admin123!', 10),
          role: 'Admin',
          isVerified: true,
          credits: 1000,
          isSuspended: false,
        },
      });
      
      console.log('Admin user updated successfully:', updatedAdmin.email);
    }
    
    // Verify the admin user can be retrieved with isVerified field
    const verifiedAdmin = await prisma.user.findUnique({
      where: { email: 'admin@planetqai.com' },
      select: { id: true, email: true, isVerified: true, role: true }
    });
    
    console.log('Admin user verification:', verifiedAdmin);
    
  } catch (error) {
    console.error('Error fixing admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminUser()
  .then(() => console.log('Admin user fix completed'))
  .catch(e => console.error('Admin user fix failed:', e));
