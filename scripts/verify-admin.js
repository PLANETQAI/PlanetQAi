const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAdminUser() {
  try {
    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'Admin',
      },
    });

    if (!adminUser) {
      console.log('No admin user found. Please run the create-admin.js script first.');
      return;
    }

    console.log('Admin user details:');
    console.log('Email:', adminUser.email);
    console.log('Role:', adminUser.role);
    console.log('Verified:', adminUser.isVerified);
    console.log('Credits:', adminUser.credits);
    console.log('Created At:', adminUser.createdAt);

    // Ensure the admin user is verified and has proper settings
    const updatedAdmin = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        isVerified: true,
        credits: 1000, // Ensure admin has plenty of credits
        isSuspended: false,
      },
    });

    console.log('\nAdmin user has been verified and updated:');
    console.log('Email:', updatedAdmin.email);
    console.log('Role:', updatedAdmin.role);
    console.log('Verified:', updatedAdmin.isVerified);
    console.log('Credits:', updatedAdmin.credits);
    
    console.log('\nYou can now log in with:');
    console.log('Email: admin@planetqai.com');
    console.log('Password: Admin123!');
    console.log('After login, you will be automatically redirected to the admin dashboard.');
  } catch (error) {
    console.error('Error verifying admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminUser();
