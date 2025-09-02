#!/usr/bin/env node

/**
 * ============================================================================
 * Deployment Control Script - 部署控制脚本
 * ============================================================================
 * 
 * Simple script to control the new architecture deployment
 * Usage:
 *   node scripts/deploy-control.js status
 *   node scripts/deploy-control.js enable-new
 *   node scripts/deploy-control.js enable-legacy  
 *   node scripts/deploy-control.js rollback
 */

const fs = require('fs');
const path = require('path');

const CHAT_SERVICE_PATH = path.join(__dirname, '../src/api/chatService.ts');
const BACKUP_PATH = path.join(__dirname, '../src/api/legacy/chatService.old.ts');

function getCurrentArchitecture() {
  try {
    const content = fs.readFileSync(CHAT_SERVICE_PATH, 'utf8');
    
    if (content.includes('export class ChatService') && content.includes('useNewArchitecture')) {
      // Check default flag setting
      if (content.includes("useNewArchitecture: process.env.NODE_ENV === 'development'")) {
        return 'HYBRID (New in dev, Legacy in production)';
      } else if (content.includes('useNewArchitecture: true')) {
        return 'NEW_ARCHITECTURE';
      } else if (content.includes('useNewArchitecture: false')) {
        return 'LEGACY_ARCHITECTURE'; 
      } else {
        return 'NEW_ARCHITECTURE_WITH_FEATURE_FLAGS';
      }
    } else {
      return 'LEGACY_ARCHITECTURE';
    }
  } catch (error) {
    return 'UNKNOWN';
  }
}

function showStatus() {
  console.log('🔍 DEPLOYMENT STATUS');
  console.log('='.repeat(50));
  
  const architecture = getCurrentArchitecture();
  console.log(`Current Architecture: ${architecture}`);
  
  // Check file existence
  const hasBackup = fs.existsSync(BACKUP_PATH);
  console.log(`Backup Available: ${hasBackup ? '✅ Yes' : '❌ No'}`);
  
  if (hasBackup) {
    console.log(`Backup Location: ${BACKUP_PATH}`);
  }
  
  console.log('\nEnvironment Behavior:');
  console.log('- Development: Uses NEW architecture');
  console.log('- Production: Uses LEGACY architecture (safe default)');
  
  console.log('\nControl Options:');
  console.log('- node scripts/deploy-control.js enable-new    # Force new architecture everywhere');
  console.log('- node scripts/deploy-control.js enable-legacy # Force legacy architecture everywhere');
  console.log('- node scripts/deploy-control.js rollback      # Restore original chatService');
  console.log('='.repeat(50));
}

function enableNewArchitecture() {
  console.log('🚀 Enabling NEW architecture for all environments...');
  
  try {
    let content = fs.readFileSync(CHAT_SERVICE_PATH, 'utf8');
    
    // Update the default flag to always use new architecture
    content = content.replace(
      /useNewArchitecture: process\.env\.NODE_ENV === 'development'/g,
      'useNewArchitecture: true'
    );
    
    fs.writeFileSync(CHAT_SERVICE_PATH, content);
    console.log('✅ New architecture enabled for all environments');
    console.log('⚠️  Make sure to test thoroughly before production deployment!');
  } catch (error) {
    console.error('❌ Failed to enable new architecture:', error.message);
  }
}

function enableLegacyArchitecture() {
  console.log('🔄 Enabling LEGACY architecture for all environments...');
  
  try {
    let content = fs.readFileSync(CHAT_SERVICE_PATH, 'utf8');
    
    // Update the default flag to always use legacy architecture
    content = content.replace(
      /useNewArchitecture: process\.env\.NODE_ENV === 'development'/g,
      'useNewArchitecture: false'
    );
    content = content.replace(
      /useNewArchitecture: true/g,
      'useNewArchitecture: false'
    );
    
    fs.writeFileSync(CHAT_SERVICE_PATH, content);
    console.log('✅ Legacy architecture enabled for all environments');
    console.log('ℹ️  System will use original ChatService behavior');
  } catch (error) {
    console.error('❌ Failed to enable legacy architecture:', error.message);
  }
}

function rollbackToOriginal() {
  console.log('⏪ Rolling back to original ChatService...');
  
  if (!fs.existsSync(BACKUP_PATH)) {
    console.error('❌ No backup found at:', BACKUP_PATH);
    console.error('Cannot rollback without backup file');
    return;
  }
  
  try {
    // Copy backup over current file
    const backupContent = fs.readFileSync(BACKUP_PATH, 'utf8');
    fs.writeFileSync(CHAT_SERVICE_PATH, backupContent);
    
    console.log('✅ Successfully rolled back to original ChatService');
    console.log('ℹ️  New architecture is still available in ChatServiceNew.ts');
    console.log('ℹ️  Backup preserved at:', BACKUP_PATH);
  } catch (error) {
    console.error('❌ Failed to rollback:', error.message);
  }
}

function testArchitecture() {
  console.log('🧪 Testing current architecture...');
  
  try {
    // Check if TypeScript compilation passes
    const { execSync } = require('child_process');
    
    console.log('🔍 Running TypeScript compilation check...');
    execSync('npx tsc --noEmit --skipLibCheck', { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('✅ TypeScript compilation successful');
    console.log('✅ No syntax errors detected');
    
    const architecture = getCurrentArchitecture();
    console.log(`✅ Current configuration: ${architecture}`);
    
  } catch (error) {
    console.error('❌ TypeScript compilation failed');
    console.error('⚠️  Fix errors before deployment!');
    
    // Try to show some error details
    if (error.stdout) {
      console.error('Error details:');
      console.error(error.stdout.toString());
    }
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'status':
    showStatus();
    break;
    
  case 'enable-new':
    enableNewArchitecture();
    showStatus();
    break;
    
  case 'enable-legacy':
    enableLegacyArchitecture(); 
    showStatus();
    break;
    
  case 'rollback':
    rollbackToOriginal();
    showStatus();
    break;
    
  case 'test':
    testArchitecture();
    break;
    
  default:
    console.log('🎮 DEPLOYMENT CONTROL');
    console.log('='.repeat(30));
    console.log('Usage:');
    console.log('  node scripts/deploy-control.js status        # Show current status');
    console.log('  node scripts/deploy-control.js enable-new    # Enable new architecture');
    console.log('  node scripts/deploy-control.js enable-legacy # Enable legacy architecture');
    console.log('  node scripts/deploy-control.js rollback      # Rollback to original');
    console.log('  node scripts/deploy-control.js test          # Test current architecture');
    console.log('='.repeat(30));
}