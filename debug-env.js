// Debug current environment and ChatService usage
console.log('=== Environment Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('typeof NODE_ENV:', typeof process.env.NODE_ENV);
console.log('NODE_ENV === "development":', process.env.NODE_ENV === 'development');

// Check Next.js environment
console.log('\n=== Next.js Environment ===');
console.log('Is browser:', typeof window !== 'undefined');
console.log('Is server:', typeof window === 'undefined');

// Simulate the ChatService logic
const useNewArchitecture = process.env.NODE_ENV === 'development';
console.log('\n=== ChatService Architecture Decision ===');
console.log('useNewArchitecture:', useNewArchitecture);
console.log('Will use:', useNewArchitecture ? 'ChatServiceNew (New Architecture)' : 'Legacy Architecture');