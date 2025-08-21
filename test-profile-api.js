const express = require('express')
const jwt = require('jsonwebtoken')
const db = require('./api/config/database')
require('dotenv').config({ path: './api/.env' })

const JWT_SECRET = process.env.JWT_SECRET || 'a_very_strong_and_unique_secret_key_for_swimming_pool_system_2025'

async function testProfileAPI() {
  try {
    console.log('Testing Profile API...')
    console.log('JWT_SECRET:', JWT_SECRET)
    
    // Test database connection
    console.log('\nTesting database connection...')
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM users')
    console.log('Users in database:', rows[0].count)
    
    // Get a sample user for testing
    const [users] = await db.execute('SELECT id, username, email FROM users LIMIT 1')
    if (users.length === 0) {
      console.log('No users found in database')
      return
    }
    
    const testUser = users[0]
    console.log('\nTest user:', testUser)
    
    // Create a test token
    const testToken = jwt.sign(
      { id: testUser.id, username: testUser.username, role: 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    console.log('\nGenerated test token:', testToken)
    
    // Verify the token
    try {
      const decoded = jwt.verify(testToken, JWT_SECRET)
      console.log('Token verification successful:', decoded)
    } catch (error) {
      console.log('Token verification failed:', error.message)
    }
    
    // Test the profile query
    console.log('\nTesting profile query...')
    const [profileUsers] = await db.execute(
      "SELECT id, username, email, first_name, last_name, phone, address, date_of_birth, id_card, organization, age, medical_condition, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, profile_photo, role, status, created_at FROM users WHERE id = ?",
      [testUser.id]
    )
    
    if (profileUsers.length === 0) {
      console.log('User not found in profile query')
    } else {
      console.log('Profile query successful:', profileUsers[0])
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    process.exit(0)
  }
}

testProfileAPI()