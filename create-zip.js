
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Creating CyberShield AI project zip file...\n');

try {
  // Remove existing zip if it exists
  if (fs.existsSync('cybershield-project.zip')) {
    fs.unlinkSync('cybershield-project.zip');
    console.log('📦 Removed existing zip file');
  }

  // Create comprehensive zip with all project files
  console.log('📁 Packaging project files...');
  
  const zipCommand = `zip -r cybershield-project.zip . \\
    -x "node_modules/*" \\
    -x ".git/*" \\
    -x "dist/*" \\
    -x ".replit" \\
    -x "replit.nix" \\
    -x "*.log" \\
    -x "*.tmp" \\
    -x ".env*" \\
    -x "cybershield-project.zip"`;
  
  execSync(zipCommand, { stdio: 'inherit' });
  
  // Get file size for confirmation
  const stats = fs.statSync('cybershield-project.zip');
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('\n✅ Project successfully packaged!');
  console.log(`📦 File: cybershield-project.zip (${fileSizeInMB} MB)`);
  console.log('\n📋 Package includes:');
  console.log('   • Complete React frontend (client/)');
  console.log('   • Express backend with APIs (server/)');
  console.log('   • Shared database schema');
  console.log('   • All UI components and pages');
  console.log('   • Configuration files');
  console.log('   • README and documentation');
  
  console.log('\n🔽 To download: Right-click on "cybershield-project.zip" in the file explorer and select "Download"');
  console.log('\n🚀 To run locally:');
  console.log('   1. Extract the zip file');
  console.log('   2. Run: npm install');
  console.log('   3. Set up .env with DATABASE_URL');
  console.log('   4. Run: npm run db:push');
  console.log('   5. Run: npm run dev');
  
} catch (error) {
  console.error('❌ Error creating zip file:', error.message);
  console.log('\n💡 Alternative: You can manually download files via the Replit file explorer');
}
