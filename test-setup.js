#!/usr/bin/env node

/**
 * Quick setup verification script
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying TRON Lock System setup...\n');

const checks = [
  {
    name: 'Project structure',
    check: () => {
      const requiredDirs = ['backend', 'frontend', 'bot', 'scripts'];
      return requiredDirs.every(dir => fs.existsSync(dir));
    }
  },
  {
    name: 'Environment file',
    check: () => fs.existsSync('.env') || fs.existsSync('.env.example')
  },
  {
    name: 'Backend package.json',
    check: () => fs.existsSync('backend/package.json')
  },
  {
    name: 'Frontend package.json',
    check: () => fs.existsSync('frontend/package.json')
  },
  {
    name: 'Bot package.json',
    check: () => fs.existsSync('bot/package.json')
  },
  {
    name: 'Docker configuration',
    check: () => fs.existsSync('docker-compose.yml')
  },
  {
    name: 'README documentation',
    check: () => fs.existsSync('README.md')
  },
  {
    name: 'Backend Prisma schema',
    check: () => fs.existsSync('backend/prisma/schema.prisma')
  },
  {
    name: 'Backend main entry point',
    check: () => fs.existsSync('backend/src/index.ts')
  },
  {
    name: 'Bot main entry point',
    check: () => fs.existsSync('bot/src/index.ts')
  }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
  try {
    if (check.check()) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`❌ ${check.name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name} - Error: ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📋 Total: ${checks.length}`);

if (failed === 0) {
  console.log('\n🎉 All checks passed! The system is ready for setup.');
  console.log('\nNext steps:');
  console.log('1. Run: ./scripts/setup-testnet.sh');
  console.log('2. Configure your .env file');
  console.log('3. Start the services: npm run dev');
} else {
  console.log('\n⚠️  Some checks failed. Please review the missing files.');
  process.exit(1);
}