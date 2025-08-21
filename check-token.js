const jwt = require('jsonwebtoken');

// Get token from command line argument or use default
const token = process.argv[2] || 'your-token-here';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Token is valid!');
  console.log('Decoded token:', JSON.stringify(decoded, null, 2));
  console.log('User ID:', decoded.id);
  console.log('User Role:', decoded.role);
  
  if (decoded.role === 'admin') {
    console.log('✅ User has admin privileges');
  } else {
    console.log('❌ User does NOT have admin privileges');
  }
} catch (error) {
  console.log('❌ Token is invalid or expired');
  console.log('Error:', error.message);
}

console.log('\nTo check your browser token, run this in browser console:');
console.log('const token = localStorage.getItem("token"); console.log("Token:", token);');
console.log('\nThen run: node check-token.js "YOUR_TOKEN_HERE"');