const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'Admin',
      },
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      
      // Update the existing admin user to ensure all fields are set correctly
      const updatedAdmin = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          isVerified: true,
          isSuspended: false,
          credits: existingAdmin.credits < 500 ? 1000 : existingAdmin.credits,
        },
      });
      
      console.log('Admin user updated successfully:', updatedAdmin.email);
      return;
    }

    // Create admin user with all required fields
    const adminUser = await prisma.user.create({
      data: {
        fullName: 'Admin User',
        email: 'admin@planetqai.com',
        password: bcrypt.hashSync('Admin123!', 10), // Simple password for documentation
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

    console.log('Admin user created successfully:', adminUser.email);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
