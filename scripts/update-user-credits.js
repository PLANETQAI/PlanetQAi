/**
 * Script to update credits for users in the PlanetQAi application
 * 
 * Usage:
 * node scripts/update-user-credits.js --email user@example.com --credits 100 --reason "Promotional credits"
 * node scripts/update-user-credits.js --all --credits 50 --reason "System maintenance compensation"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('email', {
    alias: 'e',
    description: 'Email of the user to update credits for',
    type: 'string',
  })
  .option('userId', {
    alias: 'u',
    description: 'ID of the user to update credits for',
    type: 'string',
  })
  .option('all', {
    alias: 'a',
    description: 'Update credits for all users',
    type: 'boolean',
  })
  .option('credits', {
    alias: 'c',
    description: 'Number of credits to add (positive) or subtract (negative)',
    type: 'number',
    demandOption: true
  })
  .option('reason', {
    alias: 'r',
    description: 'Reason for credit update',
    type: 'string',
    default: 'Manual adjustment'
  })
  .option('dryRun', {
    alias: 'd',
    description: 'Perform a dry run without making actual changes',
    type: 'boolean',
    default: false
  })
  .check((argv) => {
    if ((!argv.email && !argv.userId && !argv.all) || 
        (argv.email && argv.userId) || 
        ((argv.email || argv.userId) && argv.all)) {
      throw new Error('Specify either --email, --userId, or --all');
    }
    return true;
  })
  .help()
  .alias('help', 'h')
  .argv;

async function updateUserCredits() {
  try {
    console.log('Starting credit update process...');
    
    if (argv.dryRun) {
      console.log('DRY RUN MODE - No actual changes will be made');
    }

    // Determine which users to update
    let users = [];
    
    if (argv.all) {
      console.log('Fetching all users...');
      users = await prisma.user.findMany({
        select: { id: true, email: true, credits: true }
      });
      console.log(`Found ${users.length} users`);
    } else if (argv.email) {
      console.log(`Looking up user with email: ${argv.email}`);
      const user = await prisma.user.findUnique({
        where: { email: argv.email },
        select: { id: true, email: true, credits: true }
      });
      
      if (!user) {
        console.error(`User with email ${argv.email} not found`);
        process.exit(1);
      }
      
      users = [user];
    } else if (argv.userId) {
      console.log(`Looking up user with ID: ${argv.userId}`);
      const user = await prisma.user.findUnique({
        where: { id: argv.userId },
        select: { id: true, email: true, credits: true }
      });
      
      if (!user) {
        console.error(`User with ID ${argv.userId} not found`);
        process.exit(1);
      }
      
      users = [user];
    }

    // Update credits for each user
    console.log(`Updating credits for ${users.length} user(s)...`);
    
    for (const user of users) {
      const newCreditBalance = user.credits + argv.credits;
      
      console.log(`User: ${user.email} (${user.id})`);
      console.log(`  Current credits: ${user.credits}`);
      console.log(`  Adjustment: ${argv.credits > 0 ? '+' : ''}${argv.credits}`);
      console.log(`  New balance: ${newCreditBalance}`);
      
      if (!argv.dryRun) {
        // Update user credits
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { credits: newCreditBalance }
        });
        
        // Log the credit change
        await prisma.creditLog.create({
          data: {
            userId: user.id,
            amount: argv.credits,
            balanceAfter: updatedUser.credits,
            description: argv.reason || 'Manual credit adjustment',
            relatedEntityId: `manual-${Date.now()}`,
            relatedEntityType: 'script'
          }
        });
        
        console.log('  ✅ Credits updated successfully');
      } else {
        console.log('  ⚠️ DRY RUN - No changes made');
      }
      console.log('-----------------------------------');
    }
    
    console.log('Credit update process completed');
  } catch (error) {
    console.error('Error updating credits:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserCredits();
