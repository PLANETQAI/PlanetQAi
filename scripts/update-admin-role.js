// Script to update a user to admin role
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUserToAdmin(email) {
  try {
    console.log(`Looking for user with email: ${email}`);
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      console.error(`User with email ${email} not found`);
      return;
    }

    console.log(`Found user: ${user.email} (${user.id}), current role: ${user.role || 'none'}`);

    // Update the user's role to Admin (using the correct enum value)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'Admin' },
      select: { id: true, email: true, role: true }
    });

    console.log(`Successfully updated user role to admin:`);
    console.log(`User: ${updatedUser.email} (${updatedUser.id})`);
    console.log(`New role: ${updatedUser.role}`);
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    // Close the Prisma connection
    await prisma.$disconnect();
  }
}

// Email to update
const targetEmail = process.argv[2] || 'planetqproductions@yahoo.com';

// Run the function
updateUserToAdmin(targetEmail)
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err));
