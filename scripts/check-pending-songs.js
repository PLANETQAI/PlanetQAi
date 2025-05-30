// Script to manually trigger the cron job to check for pending songs
// Usage: node scripts/check-pending-songs.js

const axios = require('axios');
require('dotenv').config();

async function checkPendingSongs() {
  try {
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not set');
      process.exit(1);
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${appUrl}/api/cron/check-pending-songs?secret=${cronSecret}`;
    
    console.log(`Triggering cron job at: ${url}`);
    
    const response = await axios.get(url);
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log(`Processed ${response.data.processed} pending songs`);
    
    // Print a summary of the results
    if (response.data.results && response.data.results.length > 0) {
      const statusCounts = response.data.results.reduce((acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Status summary:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    }
  } catch (error) {
    console.error('Error triggering cron job:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

checkPendingSongs();
