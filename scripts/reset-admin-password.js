const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@planetqai.com',
      },
    });

    if (!adminUser) {
      console.log('Admin user not found!');
      return;
    }

    console.log('Found admin user:', adminUser.email);
    
    // Generate a new password hash
    const newPasswordHash = bcrypt.hashSync('Admin123!', 10);
    
    // Update the admin user with the new password
    const updatedAdmin = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password: newPasswordHash,
      },
    });

    console.log('Admin password has been reset successfully.');
    console.log('You can now log in with:');
    console.log('Email: admin@planetqai.com');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
