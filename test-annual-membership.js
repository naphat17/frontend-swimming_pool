const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'swimming_pool_db'
};

async function testAnnualMembership() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');
    
    // Check current memberships
    console.log('\n=== Current Memberships ===');
    const [memberships] = await connection.execute(`
      SELECT u.username, u.first_name, u.last_name, 
             mt.name as membership_type, m.membership_type_id,
             m.expires_at, m.status, m.created_at
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      JOIN membership_types mt ON m.membership_type_id = mt.id
      ORDER BY m.created_at DESC
    `);
    
    console.table(memberships);
    
    // Check membership types
    console.log('\n=== Membership Types ===');
    const [types] = await connection.execute('SELECT * FROM membership_types');
    console.table(types);
    
    // Create a test annual membership for user1 (id=2)
    console.log('\n=== Creating Test Annual Membership ===');
    
    // First, deactivate any existing memberships for user1
    await connection.execute(`
      UPDATE memberships 
      SET status = 'expired' 
      WHERE user_id = 2
    `);
    
    // Create new annual membership
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year from now
    
    await connection.execute(`
      INSERT INTO memberships (user_id, membership_type_id, expires_at, status, created_at)
      VALUES (2, 2, ?, 'active', NOW())
    `, [expiryDate.toISOString().split('T')[0]]);
    
    console.log('✅ Created annual membership for user1');
    console.log('Expiry date:', expiryDate.toISOString().split('T')[0]);
    
    // Verify the creation
    console.log('\n=== Updated Memberships ===');
    const [updatedMemberships] = await connection.execute(`
      SELECT u.username, u.first_name, u.last_name, 
             mt.name as membership_type, m.membership_type_id,
             m.expires_at, m.status, m.created_at
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      JOIN membership_types mt ON m.membership_type_id = mt.id
      WHERE m.status = 'active'
      ORDER BY m.created_at DESC
    `);
    
    console.table(updatedMemberships);
    
    // Test the dashboard API response
    console.log('\n=== Testing Dashboard API Response ===');
    const [dashboardData] = await connection.execute(`
      SELECT mt.name as type, m.expires_at, m.status, m.membership_type_id
      FROM memberships m 
      JOIN membership_types mt ON m.membership_type_id = mt.id 
      WHERE m.user_id = 2 AND m.status = 'active'
      ORDER BY m.expires_at DESC LIMIT 1
    `);
    
    console.log('Dashboard API would return:');
    console.log(dashboardData[0]);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

testAnnualMembership();