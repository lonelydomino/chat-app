#!/usr/bin/env node

// Simple test to see if the build environment is working
console.log('🔍 Testing build environment...');

// Check Node.js version
console.log('Node.js version:', process.version);

// Check environment
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

// Check if we can require basic packages
try {
  const next = require('next');
  console.log('✅ Next.js can be required');
} catch (error) {
  console.error('❌ Next.js require failed:', error.message);
}

try {
  const react = require('react');
  console.log('✅ React can be required');
} catch (error) {
  console.error('❌ React require failed:', error.message);
}

try {
  const mongoose = require('mongoose');
  console.log('✅ Mongoose can be required');
} catch (error) {
  console.error('❌ Mongoose require failed:', error.message);
}

console.log('🏁 Build environment test complete');
