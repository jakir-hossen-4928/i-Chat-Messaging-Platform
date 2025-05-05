
#!/usr/bin/env node

/**
 * This script ensures Vite runs correctly even if the global command isn't available
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define paths
const projectRoot = process.cwd();
const localVitePath = path.join(projectRoot, 'node_modules', '.bin', 'vite');

console.log('Checking for local Vite installation...');

if (fs.existsSync(localVitePath)) {
  console.log(`Local Vite found at: ${localVitePath}`);
  console.log('Running local Vite...');
  
  try {
    // Use the local installation directly
    execSync(`"${localVitePath}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Error running local Vite:', error);
    process.exit(1);
  }
} else {
  console.log('Local Vite not found, trying with npx...');
  
  try {
    // Try running with npx
    execSync('npx vite', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to run Vite with npx:', error);
    console.error('Please ensure Vite is installed by running: npm install vite');
    process.exit(1);
  }
}
