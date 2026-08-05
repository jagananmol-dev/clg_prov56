import killPort from 'kill-port';

async function run() {
  console.log('🔄 Cleaning up previously running servers (freeing ports)...');
  
  try {
    // Attempt to kill anything running on our 3 ports
    await Promise.all([
      killPort(3000).catch(() => {}),
      killPort(5173).catch(() => {}),
      killPort(4000).catch(() => {})
    ]);
  } catch (err) {
    // Ignore errors if ports are already free
  }

  console.log('\n======================================================');
  console.log(' 🚀 STARTING THE DORM STORE DEVELOPER ENVIRONMENT');
  console.log('======================================================\n');
  console.log(' 🛒 USER FRONTEND (Store) : http://localhost:3000');
  console.log(' 🛡️  ADMIN PORTAL         : http://localhost:5173');
  console.log(' ⚙️  BACKEND API          : http://localhost:4000\n');
  console.log('------------------------------------------------------');
  console.log('Starting servers now...\n');
}

run();
