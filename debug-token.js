const jwt = require('jsonwebtoken')

// Get JWT_SECRET from environment or use default
const JWT_SECRET = process.env.JWT_SECRET || 'a_very_strong_and_unique_secret_key_for_swimming_pool_system_2025'

// Get token from localStorage (you'll need to paste it manually)
const token = process.argv[2] // Pass token as command line argument

if (!token) {
  console.log('Usage: node debug-token.js <your_jwt_token>')
  console.log('To get your token:')
  console.log('1. Open browser console on your app')
  console.log('2. Run: localStorage.getItem("token")')
  console.log('3. Copy the token and run this script')
  process.exit(1)
}

console.log('JWT_SECRET:', JWT_SECRET)
console.log('Token:', token)

try {
  const decoded = jwt.verify(token, JWT_SECRET)
  console.log('Token is valid!')
  console.log('Decoded payload:', decoded)
} catch (error) {
  console.log('Token verification failed:')
  console.log('Error:', error.message)
  
  // Try to decode without verification to see the payload
  try {
    const decoded = jwt.decode(token)
    console.log('Token payload (unverified):', decoded)
  } catch (decodeError) {
    console.log('Cannot decode token:', decodeError.message)
  }
}